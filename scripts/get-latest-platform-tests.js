"use strict";

if (process.env.NO_UPDATE) {
  process.exit(0);
}

const fs = require("fs");
const path = require("path");
const util = require("util");
const stream = require("stream");

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
const commitHash = "6fbd872e9ac5fe60e32946bc9b318be6eeada123";

const urlPrefix = `https://raw.githubusercontent.com/web-platform-tests/wpt/${commitHash}/url/`;
const targetDir = path.resolve(__dirname, "..", "test", "web-platform-tests");

for (const file of [
  "resources/setters_tests.json",
  "resources/toascii.json",
  "resources/urltestdata.json",
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
