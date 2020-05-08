"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { URL, URLSearchParams } = require("..");
const DOMException = require("domexception");
const testharness = require("./testharness");
const parsingTestCases = require("./web-platform-tests/resources/urltestdata.json");
const additionalParsingTestCases = require("./to-upstream.json");
const setterTestData = require("./web-platform-tests/resources/setters_tests.json");
const toASCIITestCases = require("./web-platform-tests/resources/toascii.json");

const wptDir = path.join(__dirname, "web-platform-tests");

function asyncTest() {
  return {
    step(cb) {
      cb();
    },
    step_func(cb) { // eslint-disable-line camelcase
      return cb;
    },
    done() {}
  };
}

class FauxXMLHttpRequest {
  constructor() {
    this._path = undefined;
    this.responseType = undefined;
    this.response = undefined;
  }

  open(method, pathToOpen) {
    this._path = pathToOpen;
  }

  send() {}

  get onload() {
    assert(false, "This should not be called");
    return null;
  }

  set onload(cb) {
    assert(this.responseType === "json");
    const buf = fs.readFileSync(path.resolve(__dirname, `web-platform-tests/${this._path}`), "utf8");
    this.response = JSON.parse(buf);
    cb();
  }
}

function createSandbox() {
  const sandbox = {
    URL,
    URLSearchParams,
    // Shim for urlsearchparams-constructor.js
    DOMException,
    // Shim for url-constructor.js
    async_test: asyncTest, // eslint-disable-line camelcase
    XMLHttpRequest: FauxXMLHttpRequest
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

function testToASCII(testCase) {
  return () => {
    if (testCase.output !== null) {
      const url = new URL(`https://${testCase.input}/x`);
      assert.equal(url.host, testCase.output);
      assert.equal(url.hostname, testCase.output);
      assert.equal(url.pathname, "/x");
      assert.equal(url.href, `https://${testCase.output}/x`);

      const url2 = new URL("https://x/x");
      url2.hostname = testCase.input;
      assert.equal(url2.hostname, testCase.output);

      const url3 = new URL("https://x/x");
      url3.host = testCase.input;
      assert.equal(url3.host, testCase.output);
    } else {
      assert.throws(() => new URL(`https://${testCase.input}/x`), TypeError);

      const url2 = new URL("https://x/x");
      url2.hostname = testCase.input;
      assert.equal(url2.hostname, "x");

      const url3 = new URL("https://x/x");
      url3.host = testCase.input;
      assert.equal(url3.host, "x");
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

      test(`<${expected.input}> against <${expected.base}>`, testURL(expected));
    }
  });

  describe("bad base URL", () => {
    for (const rawExpected of parsingTestCases) {
      if (typeof rawExpected === "string" || !rawExpected.failure) {
        continue;
      }

      const expected = {
        input: "about:blank",
        base: rawExpected.input,
        failure: true
      };

      test(`<${expected.input}> against <${expected.base}>`, testURL(expected));
    }
  });

  describe("setters", () => {
    for (const key of Object.keys(setterTestData)) {
      if (key === "comment") {
        continue;
      }

      describe(key, () => {
        for (const testCase of setterTestData[key]) {
          test(
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

  describe("toASCII", () => {
    for (const testCase of toASCIITestCases) {
      if (typeof testCase === "string") {
        // It's a "comment"; skip it.
        continue;
      }

      let description = testCase.input;
      if (testCase.comment) {
        description += ` (${testCase.comment})`;
      }

      test(description, testToASCII(testCase));
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

      test(
        "<" + expected.input + "> against <" + expected.base + ">",
        testURL(expected)
      );
    }
  });
});
