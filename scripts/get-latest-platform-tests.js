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
// 1. Go to https://github.com/w3c/web-platform-tests/blob/master/url/urltestdata.json
// 2. Press "y" on your keyboard to get a permalink
// 3. Copy the commit hash
const commitHash = "77267eb15cbce849ac01c95fc4d85015a28539e5";

const sourceURL = `https://raw.githubusercontent.com/w3c/web-platform-tests/${commitHash}/url/urltestdata.json`;

const targetDir = path.resolve(__dirname, "..", "test", "web-platform-tests");

request.get(sourceURL)
  .pipe(fs.createWriteStream(path.resolve(targetDir, "urltestdata.json")));
