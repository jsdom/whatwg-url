"use strict";

if (process.env.NO_UPDATE) {
  process.exit(0);
}

const path = require("path");
const fs = require("fs");
const { JSDOM } = require("jsdom");
const request = require("request");

process.on("unhandledRejection", err => {
  throw err;
});

// Pin to specific version, reflecting the spec version in the readme.
//
// To get the latest commit:
// 1. Go to https://github.com/w3c/web-platform-tests/tree/master/url
// 2. Press "y" on your keyboard to get a permalink
// 3. Copy the commit hash
const commitHash = "785ec55ddc2dc2e5dfecac65832d68c82f72e50b";

// Have to use RawGit as JSDOM.fromURL checks Content-Type header.
const urlPrefix = `https://rawgit.com/w3c/web-platform-tests/${commitHash}/url/`;
const targetDir = path.resolve(__dirname, "..", "test", "web-platform-tests");

for (const file of ["urltestdata.json", "setters_tests.json", "toascii.json"]) {
  request(`${urlPrefix}${file}`)
    .pipe(fs.createWriteStream(path.resolve(targetDir, file)));
}

for (const file of [
  "urlencoded-parser.html",
  "urlsearchparams-append.html",
  "urlsearchparams-constructor.html",
  "urlsearchparams-delete.html",
  "urlsearchparams-foreach.html",
  "urlsearchparams-getall.html",
  "urlsearchparams-get.html",
  "urlsearchparams-has.html",
  "urlsearchparams-set.html",
  "urlsearchparams-sort.html",
  "urlsearchparams-stringifier.html"
]) {
  JSDOM.fromURL(`${urlPrefix}${file}`).then(({ window }) => {
    // Get last <script> in the WPT file
    const { document } = window;
    const scripts = document.getElementsByTagName("script");
    const body = scripts[scripts.length - 1].text;
    fs.writeFileSync(path.resolve(targetDir, file.replace(/\.html$/, ".js")), body);
  });
}
