"use strict";

if (process.env.NO_UPDATE) {
  process.exit(0);
}

const path = require("path");
const fs = require("fs");
const request = require("request");

const sourceURL = "https://raw.githubusercontent.com/w3c/web-platform-tests/master/url/urltestdata.json";
const targetDir = path.resolve(__dirname, "..", "test", "web-platform-tests");

request.get(sourceURL)
  .pipe(fs.createWriteStream(path.resolve(targetDir, "urltestdata.json")));
