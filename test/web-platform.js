"use strict";
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const assert = require("assert");
const DOMException = require("domexception");
const { directlyRunnableTests, resourceDependentTests } = require("../scripts/get-latest-platform-tests.js");
const testharness = require("./testharness.js");

const { utf8PercentEncodeString, isSpecialQueryPercentEncode } = require("../lib/percent-encoding.js");
const { URL, URLSearchParams } = require("..");

const idnaTestV2Data = require("./web-platform-tests/resources/IdnaTestV2.json");
const urlTestData = require("./web-platform-tests/resources/urltestdata.json");
const settersData = require("./web-platform-tests/resources/setters_tests.json");
const percentEncodingData = require("./web-platform-tests/resources/percent-encoding.json");
const toASCIIData = require("./web-platform-tests/resources/toascii.json");

describe("Directly-runnable web platform tests", () => {
  for (const testFile of directlyRunnableTests) {
    runWPT(testFile);
  }
});

describe("Data file-based web platform tests", () => {
  beforeAll(() => {
    assert.deepStrictEqual(
      resourceDependentTests,
      [
        "IdnaTestV2.window.js",
        "url-constructor.any.js",
        "url-origin.any.js",
        "url-setters.any.js"
      ],
      "The list of resource-dependent tests should be updated if new tests are added"
    );
  });

  runWPT("IdnaTestV2.window.js", sandbox => {
    sandbox.runTests(idnaTestV2Data);
  });

  runWPT("url-constructor.any.js", sandbox => {
    sandbox.runURLTests(urlTestData);
  });

  runWPT("url-origin.any.js", sandbox => {
    sandbox.runURLTests(urlTestData);
  });

  runWPT("url-setters.any.js", sandbox => {
    sandbox.runURLSettersTests(settersData);
  });
});

describe("Manually recreated web platform tests", () => {
  // Last sync:
  // https://github.com/web-platform-tests/wpt/blob/6d461b4ddb2f1b8d226ca6ae92e14bbd464731a5/url/failure.html
  describe("failure.html", () => {
    for (const data of urlTestData) {
      if (typeof data === "string" || !data.failure || data.base !== null) {
        continue;
      }

      const name = `${data.input} should throw`;

      test(`URL's constructor's base argument: ${name}`, () => {
        // URL's constructor's first argument is tested by url-constructor.html
        // If a URL fails to parse with any valid base, it must also fail to parse with no base, i.e.
        // when used as a base URL itself.
        assert.throws(() => new URL("about:blank", data.input), TypeError);
      });

      test(`URL's href: ${name}`, () => {
        const url = new URL("about:blank");
        assert.throws(() => {
          url.href = data.input;
        }, TypeError);
      });
    }
  });

  // Last sync:
  // https://github.com/web-platform-tests/wpt/blob/6d461b4ddb2f1b8d226ca6ae92e14bbd464731a5/url/percent-encoding.window.js
  describe("percent-encoding.window.js", () => {
    for (const data of percentEncodingData) {
      if (typeof data === "string") {
        continue;
      }

      // whatwg-url only supports UTF-8 percent encoding for now.
      const { input } = data;
      const output = data.output["utf-8"];

      test(`Input ${input} with encoding utf-8`, () => {
        // Unit test
        assert.equal(utf8PercentEncodeString(input, isSpecialQueryPercentEncode, false), output);

        // Integration test
        const url = new URL(`https://doesnotmatter.invalid/?${input}#${input}`);
        assert.equal(url.search, `?${output}`, "search");
        assert.equal(url.hash, `#${output}`, "hash");
      });
    }
  });

  // Last sync:
  // https://github.com/web-platform-tests/wpt/blob/6d461b4ddb2f1b8d226ca6ae92e14bbd464731a5/url/toascii.window.js
  describe("toascii.window.js", () => {
    for (const data of toASCIIData) {
      if (typeof data === "string") {
        continue;
      }

      test(`${data.input} (using URL)`, () => {
        if (data.output !== null) {
          const url = new URL(`https://${data.input}/x`);
          assert.equal(url.host, data.output);
          assert.equal(url.hostname, data.output);
          assert.equal(url.pathname, "/x");
          assert.equal(url.href, `https://${data.output}/x`);

          const url2 = new URL("https://x/x");
          url2.hostname = data.input;
          assert.equal(url2.hostname, data.output);

          const url3 = new URL("https://x/x");
          url3.host = data.input;
          assert.equal(url3.host, data.output);
        } else {
          assert.throws(() => new URL(`https://${data.input}/x`), TypeError);
        }
      });

      for (const val of ["host", "hostname"]) {
        test(`${data.input} (using URL's ${val} setter)`, () => {
          const url = new URL(`https://x/x`);
          url[val] = data.input;
          if (data.output !== null) {
            assert.equal(url[val], data.output);
          } else {
            assert.equal(url[val], "x");
          }
        });
      }
    }
  });
});

function runWPT(testFile, extraAction = () => {}) {
  describe(testFile, () => {
    const filePath = path.resolve(__dirname, "web-platform-tests", testFile);
    const code = fs.readFileSync(filePath, { encoding: "utf-8" });

    const sandbox = vm.createContext({
      URL,
      URLSearchParams,
      DOMException,
      fetch: fakeFetch,
      ...testharness
    });

    vm.runInContext(code, sandbox, {
      filename: testFile,
      displayErrors: true
    });

    extraAction(sandbox);
  });
}

function fakeFetch(url) {
  const filePath = path.resolve(__dirname, "web-platform-tests", url);
  return Promise.resolve({
    json() {
      return fs.promises.readFile(filePath, { encoding: "utf-8" }).then(JSON.parse);
    }
  });
}
