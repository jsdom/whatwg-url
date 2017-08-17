"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { URL, URLSearchParams } = require("..");
const DOMException = require("domexception");
const testharness = require("./testharness");
const parsingTestCases = require("./web-platform-tests/urltestdata.json");
const additionalParsingTestCases = require("./to-upstream.json");
const setterTestData = require("./web-platform-tests/setters_tests.json");

const wptDir = path.join(__dirname, "web-platform-tests");

function createSandbox() {
  const sandbox = {
    URL,
    URLSearchParams,
    // Shim for urlsearchparams-constructor.js
    DOMException
  };
  Object.assign(sandbox, testharness);
  vm.createContext(sandbox);
  return sandbox;
}

function runWPTFile(file) {
  const code = fs.readFileSync(file, "utf8");
  vm.runInContext(code, createSandbox(), {
    filename: file,
    displayErrors: true
  });
}

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

function testSetterCase(testCase, propertyName) {
  return () => {
    const url = new URL(testCase.href);
    url[propertyName] = testCase.new_value;

    for (const expectedProperty in testCase.expected) {
      assert.equal(url[expectedProperty], testCase.expected[expectedProperty]);
    }
  };
}

describe("Web platform tests", () => {
  describe("parsing", () => {
    for (const expected of parsingTestCases) {
      if (typeof expected === "string") {
        // It's a "comment"; skip it.
        continue;
      }

      specify(`<${expected.input}> against <${expected.base}>`, testURL(expected));
    }
  });

  describe("setters", () => {
    for (const key of Object.keys(setterTestData)) {
      if (key === "comment") {
        continue;
      }

      describe(key, () => {
        for (const testCase of setterTestData[key]) {
          specify(
            `<${testCase.href}>.${key} = "${testCase.new_value}" ${testCase.comment || ""}`,
            testSetterCase(testCase, key)
          );
        }
      });
    }
  });

  describe("Other tests extracted from .html files", () => {
    for (const file of fs.readdirSync(wptDir)) {
      if (path.extname(file) === ".js") {
        describe(file, () => {
          runWPTFile(path.join(wptDir, file));
        });
      }
    }
  });
});

describe("To-upstream tests", () => {
  describe("parsing", () => {
    for (const expected of additionalParsingTestCases) {
      if (typeof expected === "string") {
        // It's a "comment"; skip it.
        continue;
      }

      specify("<" + expected.input + "> against <" + expected.base + ">", testURL(expected));
    }
  });
});
