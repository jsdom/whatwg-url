"use strict";

if (process.env.NO_UPDATE) {
  process.exit(0);
}

const path = require("path");
const fs = require("fs");
const request = require("request");

const sourceDir = "https://raw.githubusercontent.com/w3c/web-platform-tests/master/url/";
const targetDir = path.resolve(__dirname, "..", "test", "web-platform-tests");

request.get(sourceDir + "urltestdata.txt")
  .pipe(fs.createWriteStream(path.join(targetDir, "urltestdata.txt")));

request.get(sourceDir + "urltestparser.js", function (err, resp, body) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  if (resp.statusCode < 200 || resp.statusCode >= 300) {
    console.log("GitHub returned non-successful status code (" + resp.statusCode + ")");
    process.exit(1);
  }

  body += "\nmodule.exports = URLTestParser;\n";

  fs.writeFile(path.join(targetDir, "urltestparser.js"), body);
});
