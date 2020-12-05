const execa = require("execa");
const chalk = require("chalk");
const { Lambda } = require("aws-sdk");

const lambdaClient = new Lambda({ region: "us-east-1" });

const runTask = (serviceName) =>
  new Promise(async (resolve) => {
    const runId = require("shortid").generate();
    // console.log(`${runId} start`);

    // console.log(tes);
    const start = process.hrtime();

    const params = {
      FunctionName: `lambda-perf-dev-${serviceName}`, // lambda-perf-dev-node
      // ClientContext: 'STRING_VALUE',
      InvocationType: "RequestResponse",
      LogType: "Tail",
      Payload: require("fs").readFileSync("testInput.json", "utf8"),
      // Qualifier: 'STRING_VALUE'
    };
    const result = await lambdaClient.invoke(params).promise();
    const end = process.hrtime(start);

    const latency = Number(
      ((end[0] * 1000000000 + end[1]) / 1000000).toFixed(2)
    );

    // console.log(`${runId} end`);
    resolve({
      runId,
      latency,
      executionTime: Number(decodeLogResult(result.LogResult)),
    });
  });

const runService = (count) => async (serviceName) => {
  const tasks = new Array(count).fill(serviceName);

  return tasks
    .reduce((promiseChain, currentTask, i) => {
      return promiseChain.then((chainResults) => {
        console.log("running task", serviceName, i);
        return runTask(serviceName).then((currentResult) => [
          ...chainResults,
          currentResult,
        ]);
      });
    }, Promise.resolve([]))
    .then((results) => ({
      [serviceName]: aggregateResults(results),
    }));
};

const decodeLogResult = (logResult) => {
  const [report] = Buffer.from(logResult, "base64")
    .toString("utf8")
    .split("\n")
    .filter((line) => /^REPORT/.test(line));

  return report.split(" ")[3];
};

const INVOCATIONS = Number(process.env.INVOCATIONS) || 2000;
const SERVICES = process.env.SERVICES
  ? process.env.SERVICES.split(",").map((str) => str.trim())
  : ["go", "node", "node-ts"];

(async () => {
  const results = await Promise.all(SERVICES.map(runService(INVOCATIONS)));

  const parsedResults = results.reduce((accum, val) => {
    const [k, v] = Object.entries(val)[0];
    return {
      ...accum,
      [k]: v,
    };
  }, {});

  console.log(JSON.stringify(parsedResults, null, 2));
})();

const aggregateResults = (results) => {
  const { latency, executionTime } = results.reduce(
    (accum, val) => {
      return {
        latency: accum.latency.concat(val.latency),
        executionTime: accum.latency.concat(val.executionTime),
      };
    },
    { latency: [], executionTime: [] }
  );

  return {
    latency: {
      total: results.length,
      min: Math.min.apply(Math, latency),
      max: Math.max.apply(Math, latency),
      avg: Number((sum(latency) / results.length).toFixed(2)),
    },
    duration: {
      total: results.length,
      min: Math.min.apply(Math, executionTime),
      max: Math.max.apply(Math, executionTime),
      avg: Number((sum(executionTime) / results.length).toFixed(2)),
    },
  };
};

const sum = (numbers) => numbers.reduce((accum, val) => accum + val, 0);
