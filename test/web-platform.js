"use strict";
const assert = require("assert");
const URL = require("..").URL;
const parsingTestCases = require("./web-platform-tests/urltestdata.json");
const additionalParsingTestCases = require("./to-upstream.json");
const setterTestData = require("./web-platform-tests/setters_tests.json");
const toASCIITestCases = require("./web-platform-tests/toascii.json");

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
          specify(`<${testCase.href}>.${key} = "${testCase.new_value}" ${testCase.comment || ""}`,
                  testSetterCase(testCase, key));
        }
      });
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

      specify(description, testToASCII(testCase));
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
