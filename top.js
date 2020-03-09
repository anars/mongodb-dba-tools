let outputFormat = "text";
let nsRegEx = new RegExp(".*", "u");
let delimiter = ",";
let spacer = 2;
let printHelp = false;
let printVersion = false;
const mongotopParams = [];

process.argv.forEach((param, index) => {
  if (index > 1) { // eslint-disable-line no-magic-numbers
    if (param.toLowerCase().startsWith("--collection=")) {
      nsRegEx = new RegExp(param.substr(13), "u"); // eslint-disable-line no-magic-numbers
    } else if (param.toLowerCase().startsWith("--delimiter=")) {
      delimiter = param.substr(12); // eslint-disable-line no-magic-numbers
    } else if (param.toLowerCase().startsWith("--spacer=")) {
      spacer = Number.parseInt(param.substr(9)); // eslint-disable-line no-magic-numbers
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
    } else if (param.toLowerCase() === "--text") {
      outputFormat = "text";
    } else if (!param.toLowerCase().startsWith("--verbose") && !param.toLowerCase().startsWith("-v")) {
      mongotopParams.push(param);
    }
  }
});

if (printHelp) {

} else if (printVersion) {

}

let firstRow = true;
const keys = [];

const dumpCSV = function dumpCSV(json) {
  if (firstRow) {
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
    console.log(headers.join(delimiter));
    firstRow = false;
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
  console.log(output.join(delimiter));
};

const dumpJSON = function dumpJSON(json) {
  if (firstRow) {
    console.log(`[\n${JSON.stringify(json, null, spacer)}`);
    firstRow = false;
  } else {
    console.log(`,${JSON.stringify(json, null, spacer)}`);
  }
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
  } else if (outputFormat === "json") {
    dumpJSON(json);
  }
});

mongotop.stderr.on("data", (data) => {
  console.error(`${data}`);
});

mongotop.on("close", (code) => {
  if (code !== 0) { // eslint-disable-line no-magic-numbers
    console.error(`Error : ${code}`);
  } else {
    if (outputFormat === "json") {
      console.log("]");
    }
  }
});
