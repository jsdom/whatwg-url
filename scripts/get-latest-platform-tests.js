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
const commitHash = "f415bd4b89e69e270d98a0caaac7f36fde99408d";

const urlPrefix = `https://raw.githubusercontent.com/web-platform-tests/wpt/${commitHash}/url/`;
const targetDir = path.resolve(__dirname, "..", "test", "web-platform-tests");

// These resources we download, but the test runner doesn't need to know about them.
const resources = [
  "resources/percent-encoding.json",
  "resources/setters_tests.json",
  "resources/toascii.json",
  "resources/urltestdata.json",
  "resources/IdnaTestV2.json"
];

// These tests we can download and run directly in /test/web-platform.js.
exports.directlyRunnableTests = [
  "url-searchparams.any.js",
  "url-setters-stripping.any.js",
  "url-statics-canparse.any.js",
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
  "urlsearchparams-size.any.js",
  "urlsearchparams-sort.any.js",
  "urlsearchparams-stringifier.any.js"
];

// These tests need some special handling in /test/web-platform.js, since they need to be hooked up to their resource
// files in a case-by-case way. We still download them, but they're in a separately-exported array so that the runner
// can distinguish.
exports.resourceDependentTests = [
  "IdnaTestV2.window.js",
  "url-constructor.any.js",
  "url-origin.any.js",
  "url-setters.any.js"
];

// These tests need their logic duplicated in /test/web-platform.js, because we can't easly shim them. They are not
// downloaded, but we list them here so that it's easy to understand our categorization scheme.
// - failure.html
// - percent-encoding.window.js
// - toascii.window.js

if (require.main === module) {
  fs.rmSync(targetDir, { recursive: true, force: true, maxRetries: 5 });
  fs.mkdirSync(path.resolve(targetDir, "resources"), { recursive: true });

  for (const file of [...resources, ...exports.directlyRunnableTests, ...exports.resourceDependentTests]) {
    fetch(`${urlPrefix}${file}`).then(res => {
      res.body.pipe(fs.createWriteStream(path.resolve(targetDir, file)));
    });
  }
}
