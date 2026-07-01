"use strict";
const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

const { parseURL, parseURLWithValidationErrors } = require("..");

const validationErrorNames = [
  "domain-to-ASCII",
  "domain-percent-encoded",
  "host-invalid-code-point",
  "IPv4-empty-part",
  "IPv4-too-few-parts",
  "IPv4-too-many-parts",
  "IPv4-non-numeric-part",
  "IPv4-non-decimal-part",
  "IPv4-out-of-range-part",
  "IPv6-unclosed",
  "IPv6-invalid-compression",
  "IPv6-too-many-pieces",
  "IPv6-multiple-compression",
  "IPv6-invalid-code-point",
  "IPv6-too-few-pieces",
  "IPv4-in-IPv6-too-many-pieces",
  "IPv4-in-IPv6-invalid-code-point",
  "IPv4-in-IPv6-out-of-range-part",
  "IPv4-in-IPv6-too-few-parts",
  "invalid-URL-unit",
  "special-scheme-missing-following-solidus",
  "missing-scheme-non-relative-URL",
  "invalid-reverse-solidus",
  "invalid-credentials",
  "host-missing",
  "port-out-of-range",
  "port-invalid",
  "file-invalid-Windows-drive-letter",
  "file-invalid-Windows-drive-letter-host"
];

const validationErrorTestCases = [
  {
    input: "https://xn--8i7caa/",
    validationErrors: ["domain-to-ASCII"]
  },
  {
    input: "https://\u200D.example/",
    validationErrors: ["domain-to-ASCII"],
    failure: true
  },
  {
    // A domain whose strict Unicode ToASCII fails (U+005F) but whose relaxed processing succeeds.
    input: "https://_dmarc.example.com/",
    validationErrors: ["domain-to-ASCII"]
  },
  {
    input: "https://exam%70le.org/",
    validationErrors: ["domain-percent-encoded"]
  },
  {
    input: "https://exa%23mple.org",
    validationErrors: ["domain-percent-encoded", "domain-to-ASCII"],
    failure: true
  },
  {
    input: "foo://exa[mple.org",
    validationErrors: ["host-invalid-code-point"],
    failure: true
  },
  {
    input: "https://127.0.0.1./",
    validationErrors: ["domain-to-ASCII", "IPv4-empty-part"]
  },
  {
    input: "https://1.2.3/",
    validationErrors: ["IPv4-too-few-parts"]
  },
  {
    input: "https://1.2.3.4.5/",
    validationErrors: ["IPv4-too-many-parts"],
    failure: true
  },
  {
    input: "https://test.42",
    validationErrors: ["IPv4-too-few-parts", "IPv4-non-numeric-part"],
    failure: true
  },
  {
    input: "https://127.0.0x0.1",
    validationErrors: ["IPv4-non-decimal-part"]
  },
  {
    input: "https://255.255.4000.1",
    validationErrors: ["IPv4-out-of-range-part"],
    failure: true
  },
  {
    input: "https://[::1",
    validationErrors: ["IPv6-unclosed"],
    failure: true
  },
  {
    input: "https://[:1]",
    validationErrors: ["IPv6-invalid-compression"],
    failure: true
  },
  {
    input: "https://[1:2:3:4:5:6:7:8:9]",
    validationErrors: ["IPv6-too-many-pieces"],
    failure: true
  },
  {
    input: "https://[1::1::1]",
    validationErrors: ["IPv6-multiple-compression"],
    failure: true
  },
  {
    input: "https://[1:2:3!:4]",
    validationErrors: ["IPv6-invalid-code-point"],
    failure: true
  },
  {
    input: "https://[1:2:3]",
    validationErrors: ["IPv6-too-few-pieces"],
    failure: true
  },
  {
    input: "https://[1:1:1:1:1:1:1:127.0.0.1]",
    validationErrors: ["IPv4-in-IPv6-too-many-pieces"],
    failure: true
  },
  {
    input: "https://[ffff::127.00.0.1]",
    validationErrors: ["IPv4-in-IPv6-invalid-code-point"],
    failure: true
  },
  {
    input: "https://[ffff::127.0.0.4000]",
    validationErrors: ["IPv4-in-IPv6-out-of-range-part"],
    failure: true
  },
  {
    input: "https://[ffff::127.0.0]",
    validationErrors: ["IPv4-in-IPv6-too-few-parts"],
    failure: true
  },
  {
    input: "https://example.org/>",
    validationErrors: ["invalid-URL-unit"]
  },
  {
    input: "https://example.org/%s",
    validationErrors: ["invalid-URL-unit"]
  },
  {
    input: "foo:bar baz", // U+0020 SPACE in an opaque path
    validationErrors: ["invalid-URL-unit"]
  },
  {
    input: "https:example.org",
    validationErrors: ["special-scheme-missing-following-solidus"]
  },
  {
    input: "example",
    validationErrors: ["missing-scheme-non-relative-URL"],
    failure: true
  },
  {
    input: "https://example.org\\",
    validationErrors: ["invalid-reverse-solidus"]
  },
  {
    input: "https://user@example.org",
    validationErrors: ["invalid-credentials"]
  },
  {
    input: "https://#fragment",
    validationErrors: ["host-missing"],
    failure: true
  },
  {
    input: "https://example.org:70000",
    validationErrors: ["port-out-of-range"],
    failure: true
  },
  {
    input: "https://example.org:7z",
    validationErrors: ["port-invalid"],
    failure: true
  },
  {
    input: "c|/path/to/file",
    base: "file:///c:/",
    validationErrors: ["file-invalid-Windows-drive-letter", "invalid-URL-unit"]
  },
  {
    input: "file://c:",
    validationErrors: ["file-invalid-Windows-drive-letter-host"]
  }
];

describe("validation errors", () => {
  test("test cases cover every named validation error", () => {
    const coveredErrors = new Set();
    for (const { validationErrors } of validationErrorTestCases) {
      for (const validationError of validationErrors) {
        coveredErrors.add(validationError);
      }
    }

    assert.deepStrictEqual([...coveredErrors].sort(), validationErrorNames.toSorted());
  });

  for (const testCase of validationErrorTestCases) {
    test(`${testCase.input} reports ${testCase.validationErrors.join(", ")}`, () => {
      const options = {};
      if (testCase.base !== undefined) {
        options.baseURL = parseURL(testCase.base);
        assert.notEqual(options.baseURL, null, "The base URL must parse successfully");
      }

      const { url, validationErrors } = parseURLWithValidationErrors(testCase.input, options);

      assert.deepStrictEqual(validationErrors, testCase.validationErrors);
      assert.equal(url === null, testCase.failure === true);
    });
  }

  test("reports validation errors in order, including repeated error names", () => {
    const { url, validationErrors } = parseURLWithValidationErrors(" https://user@example.org/%s ");

    assert.notEqual(url, null);
    assert.deepStrictEqual(validationErrors, [
      "invalid-URL-unit",
      "invalid-credentials",
      "invalid-URL-unit"
    ]);
  });
});
