"use strict";

if (process.env.NO_UPDATE) {
  process.exit(0);
}

const fs = require("fs");
const path = require("path");
const fetch = require("minipass-fetch");

process.on("unhandledRejection", err => {
  throw err;
});

// Pin to specific version, reflecting the spec version in the readme.
//
// To get the latest commit:
// 1. Go to https://github.com/web-platform-tests/wpt/tree/master/url
// 2. Press "y" on your keyboard to get a permalink
// 3. Copy the commit hash
const commitHash = "9216115f5621b04a27e0f2e9bbf1ce44dd7d3b9e";

const urlPrefix = `https://raw.githubusercontent.com/web-platform-tests/wpt/${commitHash}/url/`;
const targetDir = path.resolve(__dirname, "..", "test", "web-platform-tests");

(fs.rmSync || fs.rmdirSync)(targetDir, { recursive: true, force: true });
fs.mkdirSync(path.resolve(targetDir, "resources"), { recursive: true });

for (const file of [
  "resources/percent-encoding.json",
  "resources/setters_tests.json",
  "resources/toascii.json",
  "resources/urltestdata.json",
  "resources/IdnaTestV2.json",
  "url-searchparams.any.js",
  "url-setters-stripping.any.js",
  "url-tojson.any.js",
  "urlencoded-parser.any.js",
  "urlsearchparams-append.any.js",
  "urlsearchparams-constructor.any.js",
  "urlsearchparams-delete.any.js",
  "urlsearchparams-foreach.any.js",
  "urlsearchparams-getall.any.js",
  "urlsearchparams-get.any.js",
  "urlsearchparams-has.any.js",
  "urlsearchparams-set.any.js",
  "urlsearchparams-sort.any.js",
  "urlsearchparams-stringifier.any.js"
]) {
  fetch(`${urlPrefix}${file}`).then(res => {
    res.body.pipe(fs.createWriteStream(path.resolve(targetDir, file)));
  });
}
