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
const commitHash = "9d773b01a8b0461a96671140a640e85a3d02fb9a";

const urlPrefix = `https://raw.githubusercontent.com/web-platform-tests/wpt/${commitHash}/url/`;
const targetDir = path.resolve(__dirname, "..", "test", "web-platform-tests");

(fs.rmSync || fs.rmdirSync)(targetDir, { recursive: true, force: true });
fs.mkdirSync(path.resolve(targetDir, "resources"), { recursive: true });

for (const file of [
  "resources/percent-encoding.json",
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
