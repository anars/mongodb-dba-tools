let format = "text";
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
      format = "json";
    } else if (param.toLowerCase() === "--csv") {
      format = "csv";
    } else if (param.toLowerCase() === "--xml") {
      format = "xml";
    } else if (param.toLowerCase() === "--text") {
      format = "text";
    } else if (!param.toLowerCase().startsWith("--verbose") && !param.toLowerCase().startsWith("-v")) {
      mongotopParams.push(param);
    }
  }
});

if (printHelp) {
  console.log("Usage:");
  console.log("  mongotopx <options> <polling interval in seconds>\n");
  console.log("mongotopx is a wrapper for mongotop for better collection filtering and output.\n");
  console.log("mongotopx provides a method to track the amount of time a MongoDB instance mongod spends");
  console.log("reading and writing data. mongotopx provides statistics on a per-collection level.");
  console.log("By default, mongotopx returns values every second.\n");
  console.log("filtering options:");
  console.log("      --collection=<regex>                        regular expression to filter collections\n");
  console.log("general options:");
  console.log("      --help                                      print usage");
  console.log("      --version                                   print the tool version and exit\n");
  console.log("output options:");
  console.log("      --csv                                       format output as CSV");
  console.log("      --json                                      format output as JSON");
  console.log("      --text                                      format output as text");
  console.log("      --xml                                       format output as XML");
  console.log("      --delimiter=<string>                        delimeter for CSV format");
  console.log("      --spacer=<number>                           the number of space characters to use");
  console.log("                                                  to indent JSON and XML");
  console.log("      --locks                                     report on use of per-database");
  console.log("                                                  locks");
  console.log("  -n, --rowcount=<count>                          number of stats lines to");
  console.log("                                                  print (0 for indefinite)\n");
  console.log("connection options:");
  console.log("  -h, --host=<hostname>                           mongodb host(s) to connect to");
  console.log("                                                  (use commas to delimit hosts)");
  console.log("      --port=<port>                               server port (can also use");
  console.log("                                                  --host hostname:port)\n");
  console.log("ssl options:");
  console.log("      --ssl                                       connect to a mongod or mongos");
  console.log("                                                  that has ssl enabled");
  console.log("      --sslCAFile=<filename>                      the .pem file containing the");
  console.log("                                                  root certificate chain from");
  console.log("                                                  the certificate authority");
  console.log("      --sslPEMKeyFile=<filename>                  the .pem file containing the");
  console.log("                                                  certificate and key");
  console.log("      --sslPEMKeyPassword=<password>              the password to decrypt the");
  console.log("                                                  sslPEMKeyFile, if necessary");
  console.log("      --sslCRLFile=<filename>                     the .pem file containing the");
  console.log("                                                  certificate revocation list");
  console.log("      --sslAllowInvalidCertificates               bypass the validation for");
  console.log("                                                  server certificates");
  console.log("      --sslAllowInvalidHostnames                  bypass the validation for");
  console.log("                                                  server name");
  console.log("      --sslFIPSMode                               use FIPS mode of the");
  console.log("                                                  installed openssl library\n");
  console.log("authentication options:");
  console.log("  -u, --username=<username>                       username for authentication");
  console.log("  -p, --password=<password>                       password for authentication");
  console.log("      --authenticationDatabase=<database-name>    database that holds the");
  console.log("                                                  user's credentials");
  console.log("      --authenticationMechanism=<mechanism>       authentication mechanism to");
  console.log("                                                  use\n");
  console.log("kerberos options:");
  console.log("      --gssapiServiceName=<service-name>          service name to use when");
  console.log("                                                  authenticating using");
  console.log("                                                  GSSAPI/Kerberos (default:");
  console.log("                                                  mongodb)");
  console.log("      --gssapiHostName=<host-name>                hostname to use when");
  console.log("                                                  authenticating using");
  console.log("                                                  GSSAPI/Kerberos (default:");
  console.log("                                                  <remote server's address>)\n");
  console.log("uri options:");
  console.log("      --uri=mongodb-uri                           mongodb uri connection string\n");
  console.log("See http://docs.mongodb.org/manual/reference/program/mongotop/ for more information.");
  process.exit(0);
} else if (printVersion) {
  process.exit(0);
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
      console.log(`${"".padStart(spacer * 2, " ")}<collection name="${collection}" \
total-time="${json.totals[collection].total.time}" \
total-count="${json.totals[collection].total.count}" \
read-time="${json.totals[collection].read.time}" \
read-count="${json.totals[collection].read.count}" \
write-time="${json.totals[collection].write.time}" \
write-count="${json.totals[collection].write.count}"/>`);
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
  if (format === "text") {
    spacer = 0;
  }
  for (const collection in json.totals) {
    if (Reflect.has(json.totals, collection)) {
      if (!nsRegEx.test(collection)) {
        delete json.totals[collection];
      } else {
        if (format === "text" && collection.length > spacer) {
          spacer = collection.length;
        }
        if (format === "text" && json.time.length > spacer) {
          spacer = json.time.length;
        }
      }
    }
  }
  if (format === "csv") {
    dumpCSV(json);
  } else if (format === "json") {
    dumpJSON(json);
  } else if (format === "xml") {
    dumpXML(json);
  } else if (format === "text") {
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
    if (format === "json") {
      console.log("]");
    } else if (format === "xml") {
      console.log("</top>");
    }
  }
});
