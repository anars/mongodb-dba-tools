let format = "text";
let nsRegEx = new RegExp(".*", "u");
let delimiter = ",";
let spacer = 2;
const params = [];

process.argv.forEach((arg, index) => {
  if (index > 1) { // eslint-disable-line no-magic-numbers
    if (arg.toLowerCase().startsWith("--collection=")) {
      nsRegEx = new RegExp(arg.substr(13), "u"); // eslint-disable-line no-magic-numbers
    } else if (arg.toLowerCase().startsWith("--delimiter=")) {
      delimiter = arg.substr(12); // eslint-disable-line no-magic-numbers
    } else if (arg.toLowerCase().startsWith("--spacer=")) {
      spacer = Number.parseInt(arg.substr(9)); // eslint-disable-line no-magic-numbers
    } else if (arg.toLowerCase() === "--help") {
      console.log("Usage:\n" +
        "  mongotopx <options> <polling interval in seconds>\n\n" +
        "mongotopx is a wrapper for mongotop for better collection filtering and\n" +
        "output.\n\n" +
        "mongotopx provides a method to track the amount of time a MongoDB\n" +
        "instance mongod spends reading and writing data. mongotopx provides\n" +
        "statistics on a per-collection level. By default, mongotopx returns\n" +
        "values every second.\n\n" +
        "filtering options:\n" +
        "      --collection=<regex>\n" +
        "        regular expression to filter collections\n\n" +
        "general options:\n" +
        "      --help\n" +
        "        print usage\n\n" +
        "      --version\n" +
        "        print the tool version and exit\n\n" +
        "output options:\n" +
        "      --csv\n" +
        "        format output as CSV\n\n" +
        "      --json\n" +
        "        format output as JSON\n\n" +
        "      --text\n" +
        "        format output as text\n\n" +
        "      --xml\n" +
        "        format output as XML\n\n" +
        "      --delimiter=<string>\n" +
        "        delimeter for CSV format\n\n" +
        "      --spacer=<number>\n" +
        "        the number of space characters to use to indent JSON and XML\n\n" +
        "      --locks\n" +
        "        report on use of per-database locks\n\n" +
        "  -n, --rowcount=<count>\n" +
        "        number of stats lines toprint (0 for indefinite)\n\n" +
        "connection options:\n" +
        "  -h, --host=<hostname>\n" +
        "        mongodb host(s) to connect to (use commas to delimit hosts)\n\n" +
        "      --port=<port>\n" +
        "        server port (can also use --host hostname:port)\n\n" +
        "ssl options:\n" +
        "      --ssl\n" +
        "        connect to a mongod or mongosthat has ssl enabled\n\n" +
        "      --sslCAFile=<filename>\n" +
        "        the .pem file containing the root certificate chain from\n" +
        "        the certificate authority\n\n" +
        "      --sslPEMKeyFile=<filename>\n" +
        "        the .pem file containing the certificate and key\n\n" +
        "      --sslPEMKeyPassword=<password>\n" +
        "        the password to decrypt the sslPEMKeyFile, if necessary\n\n" +
        "      --sslCRLFile=<filename>\n" +
        "        the .pem file containing the certificate revocation list\n\n" +
        "      --sslAllowInvalidCertificates\n" +
        "        bypass the validation for server certificates\n\n" +
        "      --sslAllowInvalidHostnames\n" +
        "        bypass the validation for server name\n\n" +
        "      --sslFIPSMode\n" +
        "        use FIPS mode of the installed openssl library\n\n" +
        "authentication options:\n" +
        "  -u, --username=<username>\n" +
        "        username for authentication\n\n" +
        "  -p, --password=<password>\n" +
        "        password for authentication\n\n" +
        "      --authenticationDatabase=<database-name>\n" +
        "        database that holds the user's credentials\n\n" +
        "      --authenticationMechanism=<mechanism>\n" +
        "        authentication mechanism to use\n\n" +
        "kerberos options:\n" +
        "      --gssapiServiceName=<service-name>\n" +
        "        service name to use when authenticating using GSSAPI/Kerberos\n" +
        "        (default: mongodb)\n\n" +
        "      --gssapiHostName=<host-name>\n" +
        "        hostname to use when authenticating using GSSAPI/Kerberos\n" +
        "        (default: <remote server's address>)\n\n" +
        "uri options:\n" +
        "      --uri=mongodb-uri\n" +
        "        mongodb uri connection string\n\n" +
        "See https://github.com/anars/mongodb-dba-tools/ for more information.\n");
      process.exit(0);
    } else if (arg.toLowerCase() === "--version") {
      console.log("MongoDB Database Administrators' Tools version ### by Kay Anar" +
        "Copyright (c) 2020 Anar Software LLC http://anars.com\n" +
        "Permission is hereby granted, free of charge, to any person obtaining a" +
        "copy of this software and associated documentation files (the" +
        "\"Software\"), to deal in the Software without restriction, including" +
        "without limitation the rights to use, copy, modify, merge, publish," +
        "distribute, sublicense, and/or sell copies of the Software, and to" +
        "permit persons to whom the Software is furnished to do so, subject to" +
        "the following conditions:\n" +
        "The above copyright notice and this permission notice shall be included" +
        "in all copies or substantial portions of the Software.\n" +
        "THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS" +
        "OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF" +
        "MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT." +
        "IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY" +
        "CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT," +
        "TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE" +
        "SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.");
      process.exit(0);
    } else if (arg.toLowerCase() === "--json") {
      format = "json";
    } else if (arg.toLowerCase() === "--csv") {
      format = "csv";
    } else if (arg.toLowerCase() === "--xml") {
      format = "xml";
    } else if (arg.toLowerCase() === "--text") {
      format = "text";
    } else if (!arg.toLowerCase().startsWith("--verbose") && !arg.toLowerCase().startsWith("-v")) {
      params.push(arg);
    }
  }
});

if (params.length === 0) {
  console.log("MongoDB Database Administrators' Tools version ### by Kay Anar\n\n" +
    "Copyright (c) 2020 Anar Software LLC http://anars.com\n\n" +
    "Use --help parameter for usage.");
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
  ...params,
  "--quiet",
  "--json"
]);

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

mongotop.on("error", (error) => {
  console.error("An error occurred while running \"mongotop\". Pleae check that it's installed and working correctly.");
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