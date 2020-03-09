#!/usr/bin/env node

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
    for (const collection in json.totals) {
      if (Reflect.has(json.totals, collection)) {
        keys.push(collection);
        headers.push(`${collection} (total time)`);
        headers.push(`${collection} (total count)`);
        headers.push(`${collection} (read time)`);
        headers.push(`${collection} (read count)`);
        headers.push(`${collection} (write time)`);
        headers.push(`${collection} (write count)`);
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
    console.log(`,\n${JSON.stringify(json, null, spacer)}`);
  }
};

const dumpXML = function dumpXML(json) {
  if (firstRow) {
    console.log("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<top>");
    firstRow = false;
  }
  console.log(`${"".padStart(spacer, " ")}<totals timestamp="${json.time}">`);
  for (const collection in json.totals) {
    if (Reflect.has(json.totals, collection)) {
      console.log(`${"".padStart(spacer * 2, " ")}<collection "name"="${collection}" \
"total-time"="${json.totals[collection].total.time}" \
"total-count"="${json.totals[collection].total.count}" \
"read-time"="${json.totals[collection].read.time}" \
"read-count"="${json.totals[collection].read.count}" \
"write-time"="${json.totals[collection].write.time}" \
"write-count"="${json.totals[collection].write.count}"/>`);
    }
  }
  console.log(`${"".padStart(spacer, " ")}</totals>`);
};

const dumpText = function dumpText(json) {
  console.log(`${json.time.padStart(spacer, " ")}\
${"total (time)".padStart(16, " ")}\
${"total (count)".padStart(16, " ")}\
${"read (time)".padStart(16, " ")}\
${"read (count)".padStart(16, " ")}\
${"write (time)".padStart(16, " ")}\
${"write (count)".padStart(16, " ")}`);
  for (const collection in json.totals) {
    if (Reflect.has(json.totals, collection)) {
      console.log(`${collection.padStart(spacer, " ")}\
${json.totals[collection].total.time.toString().padStart(16, " ")}\
${json.totals[collection].total.count.toString().padStart(16, " ")}\
${json.totals[collection].read.time.toString().padStart(16, " ")}\
${json.totals[collection].read.count.toString().padStart(16, " ")}\
${json.totals[collection].write.time.toString().padStart(16, " ")}\
${json.totals[collection].write.count.toString().padStart(16, " ")}`);
    }
  }
};

const {spawn} = require("child_process");
const mongotop = spawn("mongotop", [
  ...mongotopParams,
  "--quiet",
  "--json"]);

mongotop.stdout.on("data", (data) => {
  const json = JSON.parse(data);
  if (outputFormat === "text") {
    spacer = 0;
  }
  for (const collection in json.totals) {
    if (Reflect.has(json.totals, collection)) {
      if (!nsRegEx.test(collection)) {
        delete json.totals[collection];
      } else {
        if (outputFormat === "text" && collection.length > spacer) {
          spacer = collection.length;
        }
        if (outputFormat === "text" && json.time.length > spacer) {
          spacer = json.time.length;
        }
      }
    }
  }
  if (outputFormat === "csv") {
    dumpCSV(json);
  } else if (outputFormat === "json") {
    dumpJSON(json);
  } else if (outputFormat === "xml") {
    dumpXML(json);
  } else if (outputFormat === "text") {
    dumpText(json);
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
    } else if (outputFormat === "xml") {
      console.log("</top>");
    }
  }
});
