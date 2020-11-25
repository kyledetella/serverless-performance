const execa = require("execa");
const chalk = require("chalk");

const run = async (arg) => {
  // console.log(`Starting ${arg}`);
  const args = "invoke -f node -p testInput.json -l".split(" ");
  const { stdout } = await execa("serverless", args);

  const [report] = stdout.split("\n").filter((line) => /^REPORT/.test(line));

  // console.log(`Finishing ${arg}`);
  return Number(report.split(" ")[3]); //`${arg} took: ${report.split(" ")[3]}ms`;
};

const runService = async (service) => {
  const results = await Promise.all(new Array(200).fill(service).map(run));
  const avg = results.reduce((accum, val) => accum + val, 0);

  return {
    service,
    total: results.length,
    min: Math.min.apply(Math, results),
    max: Math.max.apply(Math, results),
    avg: (avg / results.length).toFixed(2),
  };

  return `
${service}
${new Array(service.length).fill("_").join("")}
Total invocations: ${results.length}
Min: ${Math.min.apply(Math, results)}
Max: ${Math.max.apply(Math, results)},
Avg: ${(avg / results.length).toFixed(2)}
  `;
};

(async () => {
  await (await Promise.all(["node-ts"].map(runService))).forEach(
    ({ service, min, max, avg, total }) => {
      console.log(`
${chalk.underline(service)}
Total invocations: ${total}
Min: ${min}ms
Max: ${max}ms
Avg: ${avg}ms
    `);
    }
  );
})();

// (async () => {
//   const args = "invoke -f node -p testInput.json -l".split(" ");
//   const { stdout } = await execa("serverless", args);

//   const [report] = stdout.split("\n").filter((line) => /^REPORT/.test(line));

//   console.log(report.split(" ")[3]);
//   //=> 'unicorns'
// })();
