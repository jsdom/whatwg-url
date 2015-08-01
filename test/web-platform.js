"use strict";
/*global describe */
/*global it */

const assert = require("assert");
const fs = require("fs");
const URL = require("../lib/url").createURLConstructor();
const urlTestParser = require("./web-platform-tests/urltestparser");

const testCases = fs.readFileSync(__dirname + "/web-platform-tests/urltestdata.txt", { encoding: "utf-8" }) + "\n" +
                  fs.readFileSync(__dirname + "/additional-tests.txt", { encoding: "utf-8" });
const urlTests = urlTestParser(testCases);

function testURL(expected) {
  return function () {
    let url;
    try {
      url = new URL(expected.input, expected.base);
    } catch (e) {
      if (e instanceof TypeError && expected.protocol === ":") {
        return;
      }
      throw e;
    }

    if (expected.protocol === ":" && url.protocol !== ":") {
      assert.fail(url.href, "", "Expected URL to fail parsing, got " + url.href);
    }

    assert.equal(url.protocol, expected.protocol, "scheme");
    assert.equal(url.hostname, expected.hostname, "hostname");
    assert.equal(url.port, expected.port, "port");
    assert.equal(url.pathname, expected.path, "path");
    assert.equal(url.search, expected.search, "search");
    assert.equal(url.hash, expected.hash, "hash");
    assert.equal(url.href, expected.href, "href");
  };
}

describe("Web Platform Tests", function () {
  const l = urlTests.length;
  for (let i = 0; i < l; i++) {
    const expected = urlTests[i];

    it("Parsing: <" + expected.input + "> against <" + expected.base + ">", testURL(expected));
  }
});
