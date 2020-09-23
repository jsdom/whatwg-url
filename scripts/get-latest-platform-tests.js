"use strict";

if (process.env.NO_UPDATE) {
  process.exit(0);
}

const fs = require("fs");
const path = require("path");
const util = require("util");
const stream = require("stream");
const clearDir = require("./clear-dir");

const got = require("got");

const pipeline = util.promisify(stream.pipeline);

process.on("unhandledRejection", err => {
  throw err;
});

// Pin to specific version, reflecting the spec version in the readme.
//
// To get the latest commit:
// 1. Go to https://github.com/w3c/web-platform-tests/tree/master/url
// 2. Press "y" on your keyboard to get a permalink
// 3. Copy the commit hash
// const commitHash = "551c9d604fb8b97d3f8c65793bb047d15baddbc2";
// const urlPrefix = `https://raw.githubusercontent.com/web-platform-tests/wpt/${commitHash}/url/`;

const commitHash = "094fcd4dd2b881a7f751f9c1f55534cbe08b151f";
const urlPrefix = `https://raw.githubusercontent.com/alwinb/wpt/${commitHash}/url/`;

const targetDir = path.resolve(__dirname, "..", "test", "web-platform-tests");

clearDir(targetDir);
fs.mkdirSync(path.resolve(targetDir, "resources"), { recursive: true });

for (const file of [
  "resources/setters_tests.json",
  "resources/toascii.json",
  "resources/urltestdata.json",
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
  pipeline(
    got.stream(`${urlPrefix}${file}`),
    fs.createWriteStream(path.resolve(targetDir, file))
  );
}
