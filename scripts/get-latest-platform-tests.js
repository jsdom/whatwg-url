"use strict";

if (process.env.NO_UPDATE) {
  process.exit(0);
}

const path = require("path");
const fs = require("fs");
const request = require("request");

// Pin to specific version, reflecting the spec version in the readme.
//
// To get the latest commit:
// 1. Go to https://github.com/w3c/web-platform-tests/tree/master/url
// 2. Press "y" on your keyboard to get a permalink
// 3. Copy the commit hash
const commitHash = "34435a45164168db1403842ea7210bc99c4ef35b";

const sourceURL = `https://raw.githubusercontent.com/watilde/web-platform-tests/800055d3ddfcf570bd1cee2e8eca232ac3a402f4/url/urltestdata.json`;
const setterSourceURL = `https://raw.githubusercontent.com/watilde/web-platform-tests/800055d3ddfcf570bd1cee2e8eca232ac3a402f4/url/setters_tests.json`;

const targetDir = path.resolve(__dirname, "..", "test", "web-platform-tests");

request.get(sourceURL)
  .pipe(fs.createWriteStream(path.resolve(targetDir, "urltestdata.json")));

request.get(setterSourceURL)
  .pipe(fs.createWriteStream(path.resolve(targetDir, "setters_tests.json")));
