let outputFormat = "text";
let nsRegEx = new RegExp(".*", "u");
let delimiter = ",";
let printHelp = false;
let printVersion = false;
const mongotopParams = [];

process.argv.forEach((param, index) => {
  if (index > 1) { // eslint-disable-line no-magic-numbers
    if (param.toLowerCase().startsWith("--regex=")) {
      nsRegEx = new RegExp(param.substr(8), "u"); // eslint-disable-line no-magic-numbers
    } else if (param.toLowerCase().startsWith("--delimiter=")) {
      delimiter = param.substr(12); // eslint-disable-line no-magic-numbers
    } else if (param.toLowerCase() === "--help") {
      printHelp = true;
    } else if (param.toLowerCase() === "--version") {
      printVersion = true;
    } else if (param.toLowerCase() === "--json") {
      outputFormat = "json";
    } else if (param.toLowerCase() === "--csv") {
      outputFormat = "csv";
    } else if (param.toLowerCase() === "--xml") {
      outputFormat = "xml";
    } else if (!param.toLowerCase().startsWith("--verbose") && !param.toLowerCase().startsWith("-v")) {
      mongotopParams.push(param);
    }
  }
});

if (printHelp) {

} else if (printVersion) {

}

let printHeader = true;
const keys = [];

const dumpCSV = function dumpCSV(json) {
  if (printHeader) {
    keys.length = 0;
    const headers = ["timestamp"];
    for (const header in json.totals) {
      if (nsRegEx.test(header) && Reflect.has(json.totals, header)) {
        keys.push(header);
        headers.push(`${header} (total time)`);
        headers.push(`${header} (total count)`);
        headers.push(`${header} (read time)`);
        headers.push(`${header} (read count)`);
        headers.push(`${header} (write time)`);
        headers.push(`${header} (write count)`);
      }
    }
    console.log(headers.join(delimiter)); // eslint-disable-line no-console
    printHeader = false;
  }
  const output = [`${json.time}`];
  keys.forEach((key) => {
    output.push(json.totals[key].total.time);
    output.push(json.totals[key].total.count);
    output.push(json.totals[key].read.time);
    output.push(json.totals[key].read.count);
    output.push(json.totals[key].write.time);
    output.push(json.totals[key].write.count);
  });
  console.log(output.join(delimiter)); // eslint-disable-line no-console
};

const {spawn} = require("child_process");
const mongotop = spawn("mongotop", [
  ...mongotopParams,
  "--quiet",
  "--json"]);

mongotop.stdout.on("data", (data) => {
  const json = JSON.parse(data);
  if (outputFormat === "csv") {
    dumpCSV(json);
  }
});

mongotop.stderr.on("data", console.error); // eslint-disable-line no-console

mongotop.on("close", (code) => {
  if (code !== 0) { // eslint-disable-line no-magic-numbers
    console.error(`Error : ${code}`); // eslint-disable-line no-console
  }
});