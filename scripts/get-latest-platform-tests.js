"use strict";

if (process.env.NO_UPDATE) {
  process.exit(0);
}

const path = require("path");
const fs = require("fs");
const request = require("request");

// Pin to specific version, reflecting the spec version in the readme.
// At the moment we are pinned to a branch.
//
// To get the latest commit:
// 1. Go to https://github.com/w3c/web-platform-tests/tree/master/url
// 2. Press "y" on your keyboard to get a permalink
// 3. Copy the commit hash
const commitHash = "2c87b7d14b07b9383b837278e475d202969f6b64";

const sourceURL = `https://raw.githubusercontent.com/w3c/web-platform-tests/${commitHash}/url/urltestdata.json`;
const setterSourceURL = `https://raw.githubusercontent.com/w3c/web-platform-tests/${commitHash}/url/setters_tests.json`;

const targetDir = path.resolve(__dirname, "..", "test", "web-platform-tests");

request.get(sourceURL)
  .pipe(fs.createWriteStream(path.resolve(targetDir, "urltestdata.json")));

request.get(setterSourceURL)
  .pipe(fs.createWriteStream(path.resolve(targetDir, "setters_tests.json")));
