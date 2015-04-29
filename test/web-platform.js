"use strict";
/*global describe */
/*global it */

const assert = require("assert");
const fs = require("fs");
const URL = require("../lib/url").URL;
const uRLTestParser = require("./web-platform-tests/urltestparser");

const testCases = fs.readFileSync(__dirname + "/web-platform-tests/urltestdata.txt", { encoding: "utf-8" });
const urlTests = uRLTestParser(testCases);

describe("Web Platform Tests", function () {
  const l = urlTests.length;
  for (let i = 0; i < l; i++) {
    const expected = urlTests[i];

    it("Parsing: <" + expected.input + "> against <" + expected.base + ">", function () {
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
        assert.fail(null, null, "Expected URL to fail parsing");
      }

      assert.equal(url.href, expected.href, "href");
    });
  }
});
