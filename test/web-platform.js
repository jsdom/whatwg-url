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
    assert.equal(url.origin, expected.origin, "origin");
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

describe("MDN examples", () => {
  it("Checking all examples on MDN pass", () => {
    const a = new URL("/", "https://developer.mozilla.org");
    assert.strictEqual(a.href, "https://developer.mozilla.org/");

    const b = new URL("https://developer.mozilla.org");
    assert.strictEqual(b.href, "https://developer.mozilla.org/");

    const c = new URL("en-US/docs", b);
    assert.strictEqual(c.href, "https://developer.mozilla.org/en-US/docs");

    const d = new URL("/en-US/docs", b);
    assert.strictEqual(d.href, "https://developer.mozilla.org/en-US/docs");

    const f = new URL("/en-US/docs", d);
    assert.strictEqual(f.href, "https://developer.mozilla.org/en-US/docs");

    const g = new URL("/en-US/docs", "https://developer.mozilla.org/fr-FR/toto");
    assert.strictEqual(g.href, "https://developer.mozilla.org/en-US/docs");

    const h = new URL("/en-US/docs", a);
    assert.strictEqual(h.href, "https://developer.mozilla.org/en-US/docs");

    assert.throws(() => new URL("/en-US/docs", ""));
    assert.throws(() => new URL("/en-US/docs"));

    const k = new URL("http://www.example.com", "https://developers.mozilla.com");
    assert.strictEqual(k.href, "http://www.example.com/");

    const l = new URL("http://www.example.com", b);
    assert.strictEqual(l.href, "http://www.example.com/");
  });
});
