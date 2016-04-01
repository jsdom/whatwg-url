"use strict";
/*global describe */
/*global it */

const assert = require("assert");
const URL = require("..").URL;
const testCases = require("./web-platform-tests/urltestdata.json");
const additionalTestCases = require("./to-upstream.json");

function testURL(expected) {
  return () => {
    let url;
    try {
      url = new URL(expected.input, expected.base);
    } catch (e) {
      if (e instanceof TypeError && expected.failure) {
        return;
      }
      throw e;
    }

    assert.equal(url.href, expected.href, "href");
    if ("origin" in expected) {
      assert.equal(url.origin, expected.origin, "origin");
    }
    assert.equal(url.protocol, expected.protocol, "protocol");
    assert.equal(url.username, expected.username, "username");
    assert.equal(url.password, expected.password, "password");
    assert.equal(url.host, expected.host, "host");
    assert.equal(url.hostname, expected.hostname, "hostname");
    assert.equal(url.port, expected.port, "port");
    assert.equal(url.pathname, expected.pathname, "pathname");
    assert.equal(url.search, expected.search, "search");
    assert.equal(url.hash, expected.hash, "hash");
  };
}

describe("Web Platform Tests", () => {
  for (const expected of testCases) {
    if (typeof expected === "string") {
      // It's a "comment"; skip it.
      continue;
    }

    it("Parsing: <" + expected.input + "> against <" + expected.base + ">", testURL(expected));
  }
});

describe("To-upstream tests", () => {
  for (const expected of additionalTestCases) {
    if (typeof expected === "string") {
      // It's a "comment"; skip it.
      continue;
    }

    it("Parsing: <" + expected.input + "> against <" + expected.base + ">", testURL(expected));
  }
});
