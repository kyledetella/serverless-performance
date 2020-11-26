const execa = require("execa");
const chalk = require("chalk");
const { Lambda } = require("aws-sdk");

const lambdaClient = new Lambda({ region: "us-east-1" });

const run = async (arg) => {
  // console.log(`Starting ${arg}`);
  const args = "invoke -f node -p testInput.json -l".split(" ");
  const { stdout } = await execa("serverless", args);

  const [report] = stdout.split("\n").filter((line) => /^REPORT/.test(line));

  // console.log(`Finishing ${arg}`);
  return Number(report.split(" ")[3]); //`${arg} took: ${report.split(" ")[3]}ms`;
};

// const runService = async (service) => {
//   const results = await Promise.all(new Array(200).fill(service).map(run));
//   const avg = results.reduce((accum, val) => accum + val, 0);

//   return {
//     service,
//     total: results.length,
//     min: Math.min.apply(Math, results),
//     max: Math.max.apply(Math, results),
//     avg: (avg / results.length).toFixed(2),
//   };

//   return `
// ${service}
// ${new Array(service.length).fill("_").join("")}
// Total invocations: ${results.length}
// Min: ${Math.min.apply(Math, results)}
// Max: ${Math.max.apply(Math, results)},
// Avg: ${(avg / results.length).toFixed(2)}
//   `;
// };

const runService = (count) => async (serviceName) => {
  const results = await Promise.all(
    new Array(count).fill(serviceName).map(async () => {
      const runId = require("shortid").generate();

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

      return {
        runId,
        latency,
        executionTime: Number(decodeLogResult(result.LogResult)),
      };
    })
  );

  return { [serviceName]: aggregateResults(results) };
};

const decodeLogResult = (logResult) => {
  const [report] = Buffer.from(logResult, "base64")
    .toString("utf8")
    .split("\n")
    .filter((line) => /^REPORT/.test(line));

  return report.split(" ")[3];
};

(async () => {
  const results = await Promise.all(["node", "node-ts"].map(runService(5000)));

  console.log(JSON.stringify(results, null, 2));
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

// (async () => {
//   await (await Promise.all(["node-ts"].map(runService))).forEach(
//     ({ service, min, max, avg, total }) => {
//       console.log(`
// ${chalk.underline(service)}
// Total invocations: ${total}
// Min: ${min}ms
// Max: ${max}ms
// Avg: ${avg}ms
//     `);
//     }
//   );
// })();

// (async () => {
//   const args = "invoke -f node -p testInput.json -l".split(" ");
//   const { stdout } = await execa("serverless", args);

//   const [report] = stdout.split("\n").filter((line) => /^REPORT/.test(line));

//   console.log(report.split(" ")[3]);
//   //=> 'unicorns'
// })();
