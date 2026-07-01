"use strict";
const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

const { isValidURLString, parseURL, parseURLWithValidationErrors } = require("..");

function baseURL(input) {
  const url = parseURL(input);
  assert.notEqual(url, null, "The base URL must parse successfully");
  return url;
}

function optionsFor(testCase) {
  const options = {};

  if (testCase.base !== undefined) {
    options.baseURL = baseURL(testCase.base);
  }

  return options;
}

function testName({ input, base, validURLString }) {
  const basePart = base === undefined ? "" : ` against base ${JSON.stringify(base)}`;
  return `${JSON.stringify(input)}${basePart} is ${validURLString ? "valid" : "invalid"}`;
}

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
  "IPv6-piece-leading-zero",
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

const validationTestCases = [
  // Absolute URL strings.
  { input: "https://example.com/", validURLString: true },
  { input: "https://example.com/././foo", validURLString: true },
  { input: "https://example.org/foo//bar", validURLString: true },
  { input: "https://example.org//", validURLString: true },
  { input: "https://example.com///this///is///fine.", validURLString: true },
  { input: "https://EXAMPLE.com/../x", validURLString: true },
  { input: "https://\u2615.example/", validURLString: true },
  { input: "https://example/%25?%25#%25", validURLString: true },
  { input: "https://[::1]/", validURLString: true },
  { input: "https://127.0.0.1/", validURLString: true },
  { input: "file:///C:/demo", validURLString: true },
  { input: "hello:world", validURLString: true },
  { input: "foo://", validURLString: true },
  { input: "foo:///path", validURLString: true },
  { input: "foo:////bar", validURLString: true },
  {
    input: "foo://:80",
    validURLString: true,
    parserValidationErrors: ["host-missing"],
    parserFailure: true
  },
  { input: "foo://example:65535/path?query#fragment", validURLString: true },
  {
    input: "foo://h@x",
    validURLString: true,
    parserValidationErrors: ["invalid-credentials"]
  },
  {
    input: "foo://h:8x",
    validURLString: true,
    parserValidationErrors: ["port-invalid"],
    parserFailure: true
  },
  { input: "foo:a:b", validURLString: true },
  { input: "urn:isbn:0451450523", validURLString: true },

  { input: "https:example.org", validURLString: false, parserValidationErrors: ["special-scheme-missing-following-solidus"] },
  {
    input: "https://////example.com///",
    validURLString: false,
    parserValidationErrors: [
      "special-scheme-missing-following-solidus",
      "special-scheme-missing-following-solidus",
      "special-scheme-missing-following-solidus",
      "special-scheme-missing-following-solidus"
    ]
  },
  { input: "file:///C|/demo", validURLString: false, parserValidationErrors: ["invalid-URL-unit"] },
  { input: "https://user:password@example.org/", validURLString: false, parserValidationErrors: ["invalid-credentials"] },
  { input: "https://user@example.org", validURLString: false, parserValidationErrors: ["invalid-credentials"] },
  { input: "https://example.org/foo bar", validURLString: false, parserValidationErrors: ["invalid-URL-unit"] },
  {
    input: "https://ex ample.org/",
    validURLString: false,
    parserValidationErrors: ["domain-to-ASCII"],
    parserFailure: true
  },
  {
    input: "https://example.com:demo",
    validURLString: false,
    parserValidationErrors: ["port-invalid"],
    parserFailure: true
  },
  {
    input: "https://example.com:65536",
    validURLString: false,
    parserValidationErrors: ["port-out-of-range"],
    parserFailure: true
  },
  {
    input: "http://[www.example.com]/",
    validURLString: false,
    parserValidationErrors: ["IPv6-invalid-code-point"],
    parserFailure: true
  },
  {
    input: "http://[v7.a]/",
    validURLString: false,
    parserValidationErrors: ["IPv6-invalid-code-point"],
    parserFailure: true
  },
  {
    input: "https://[1:2:3]/",
    validURLString: false,
    parserValidationErrors: ["IPv6-too-few-pieces"],
    parserFailure: true
  },
  {
    input: "https://example.com/[]?[]#[]",
    validURLString: false,
    parserValidationErrors: [
      "invalid-URL-unit",
      "invalid-URL-unit",
      "invalid-URL-unit",
      "invalid-URL-unit",
      "invalid-URL-unit",
      "invalid-URL-unit"
    ]
  },
  {
    input: "https://example/%?%#%",
    validURLString: false,
    parserValidationErrors: ["invalid-URL-unit", "invalid-URL-unit", "invalid-URL-unit"]
  },
  {
    input: "https://%30/",
    validURLString: false,
    parserValidationErrors: ["domain-percent-encoded", "IPv4-too-few-parts"]
  },
  {
    input: "https://#fragment",
    validURLString: false,
    parserValidationErrors: ["host-missing"],
    parserFailure: true
  },
  { input: "https://xn--8i7caa/", validURLString: false, parserValidationErrors: ["domain-to-ASCII"] },
  {
    input: "https://\u200D.example/",
    validURLString: false,
    parserValidationErrors: ["domain-to-ASCII"],
    parserFailure: true
  },
  {
    input: "foo://exa[mple.org",
    validURLString: false,
    parserValidationErrors: ["host-invalid-code-point"],
    parserFailure: true
  },

  // Relative URL strings.
  {
    input: "example",
    validURLString: false,
    parserValidationErrors: ["missing-scheme-non-relative-URL"],
    parserFailure: true
  },
  { input: "example", base: "https://example.com/demo", validURLString: true },
  { input: "//example.com/path", base: "https://example.com/", validURLString: true },
  { input: "/path", base: "https://example.com/", validURLString: true },
  { input: "path/../file", base: "https://example.com/", validURLString: true },
  {
    input: "//:80",
    base: "https://example.com/",
    validURLString: true,
    parserValidationErrors: ["host-missing"],
    parserFailure: true
  },
  {
    input: "//h:8x",
    base: "foo://example.com/",
    validURLString: true,
    parserValidationErrors: ["port-invalid"],
    parserFailure: true
  },
  {
    input: "//:80",
    base: "file:///tmp/",
    validURLString: true,
    parserValidationErrors: ["domain-to-ASCII"],
    parserFailure: true
  },
  {
    input: "\\example\\path",
    base: "https://example.com/",
    validURLString: false,
    parserValidationErrors: ["invalid-reverse-solidus", "invalid-reverse-solidus"]
  },
  {
    input: "foo/%",
    base: "https://example.com/",
    validURLString: false,
    parserValidationErrors: ["invalid-URL-unit"]
  },

  // File URL strings.
  { input: "file://", validURLString: true },
  { input: "file:///", validURLString: true },
  { input: "file:///path", validURLString: true },
  { input: "file:////path", validURLString: true },
  { input: "file://host", validURLString: true },
  { input: "file://host/", validURLString: true },
  { input: "file://host/path", validURLString: true },
  { input: "file://host/C:", validURLString: true },
  { input: "file:", validURLString: false, parserValidationErrors: ["special-scheme-missing-following-solidus"] },
  { input: "file:/path", validURLString: false, parserValidationErrors: ["special-scheme-missing-following-solidus"] },
  {
    input: "file://host:80/",
    validURLString: false,
    parserValidationErrors: ["domain-to-ASCII"],
    parserFailure: true
  },
  { input: "file://host/C:/demo", validURLString: false },
  {
    input: "file://c:",
    validURLString: false,
    parserValidationErrors: ["file-invalid-Windows-drive-letter-host"]
  },
  { input: "/C:/path", base: "file:///tmp/", validURLString: true },
  { input: "/C:/path", base: "file://server/tmp/", validURLString: false },
  {
    input: "c|/path/to/file",
    base: "file:///c:/",
    validURLString: false,
    parserValidationErrors: ["file-invalid-Windows-drive-letter", "invalid-URL-unit"]
  },
  { input: "../path", base: "file://server/tmp/", validURLString: true },

  // Relative-URL-with-fragment strings with an opaque-path base.
  {
    input: "",
    base: "foo:opaque",
    validURLString: true,
    parserValidationErrors: ["missing-scheme-non-relative-URL"],
    parserFailure: true
  },
  { input: "#frag", base: "foo:opaque", validURLString: true },
  { input: "#frag%25", base: "foo:opaque", validURLString: true },
  {
    input: "#frag%",
    base: "foo:opaque",
    validURLString: false,
    parserValidationErrors: ["invalid-URL-unit"]
  },
  {
    input: "?query",
    base: "foo:opaque",
    validURLString: false,
    parserValidationErrors: ["missing-scheme-non-relative-URL"],
    parserFailure: true
  },
  {
    input: "a/b",
    base: "foo:opaque",
    validURLString: false,
    parserValidationErrors: ["missing-scheme-non-relative-URL"],
    parserFailure: true
  },
  {
    input: "/p",
    base: "foo:opaque",
    validURLString: false,
    parserValidationErrors: ["missing-scheme-non-relative-URL"],
    parserFailure: true
  },
  {
    input: "_dmarc.x",
    base: "foo:opaque",
    validURLString: false,
    parserValidationErrors: ["missing-scheme-non-relative-URL"],
    parserFailure: true
  },
  {
    input: "//example/path",
    base: "foo:opaque",
    validURLString: false,
    parserValidationErrors: ["missing-scheme-non-relative-URL"],
    parserFailure: true
  },

  // Query and fragment strings.
  { input: "?q=%25#fragment", base: "https://example.com/", validURLString: true },
  {
    input: "?q=%#fragment",
    base: "https://example.com/",
    validURLString: false,
    parserValidationErrors: ["invalid-URL-unit"]
  },
  { input: "?q#frag%25", base: "https://example.com/", validURLString: true },
  {
    input: "?q#frag%",
    base: "https://example.com/",
    validURLString: false,
    parserValidationErrors: ["invalid-URL-unit"]
  },
  { input: "https://example.com/#\u00A0", validURLString: true },
  { input: "https://example.com/#\u{1F600}", validURLString: true },
  { input: "https://example.com/#\u{10FFFD}", validURLString: true },
  { input: "https://example.com/#\u009F", validURLString: false, parserValidationErrors: ["invalid-URL-unit"] },
  { input: "https://example.com/#\u007F", validURLString: false, parserValidationErrors: ["invalid-URL-unit"] },
  { input: "https://example.com/#\uFDD0", validURLString: false, parserValidationErrors: ["invalid-URL-unit"] },
  { input: "https://example.com/#\uFFFF", validURLString: false, parserValidationErrors: ["invalid-URL-unit"] },
  { input: "https://example.com/#\u{10FFFF}", validURLString: false, parserValidationErrors: ["invalid-URL-unit"] },
  { input: "https://example.com/#\uD800", validURLString: false, parserValidationErrors: ["invalid-URL-unit"] },

  // Host strings.
  {
    input: "https://example.255/",
    validURLString: false,
    parserValidationErrors: ["IPv4-too-few-parts", "IPv4-non-numeric-part"],
    parserFailure: true
  },
  {
    input: "https://example.1/",
    validURLString: false,
    parserValidationErrors: ["IPv4-too-few-parts", "IPv4-non-numeric-part"],
    parserFailure: true
  },
  { input: "https://1.2.3/", validURLString: false, parserValidationErrors: ["IPv4-too-few-parts"] },
  { input: "https://1.2.3.4.5/", validURLString: false, parserValidationErrors: ["IPv4-too-many-parts"], parserFailure: true },
  { input: "https://256.1.1.1/", validURLString: false, parserValidationErrors: ["IPv4-out-of-range-part"], parserFailure: true },
  {
    input: "https://0x1/",
    validURLString: false,
    parserValidationErrors: ["IPv4-too-few-parts", "IPv4-non-decimal-part"]
  },
  {
    input: "https://127.0.0.1./",
    validURLString: false,
    parserValidationErrors: ["domain-to-ASCII", "IPv4-empty-part"]
  },
  {
    input: "https://test.42",
    validURLString: false,
    parserValidationErrors: ["IPv4-too-few-parts", "IPv4-non-numeric-part"],
    parserFailure: true
  },
  {
    input: "https://127.0.0x0.1",
    validURLString: false,
    parserValidationErrors: ["IPv4-non-decimal-part"]
  },
  {
    input: "https://255.255.4000.1",
    validURLString: false,
    parserValidationErrors: ["IPv4-out-of-range-part"],
    parserFailure: true
  },
  { input: "https://exam%70le.org", validURLString: false, parserValidationErrors: ["domain-percent-encoded"] },
  { input: "https://exam%70le.org/", validURLString: false, parserValidationErrors: ["domain-percent-encoded"] },
  {
    input: "https://exa%23mple.org",
    validURLString: false,
    parserValidationErrors: ["domain-percent-encoded", "domain-to-ASCII"],
    parserFailure: true
  },
  { input: "https://_dmarc.example.com", validURLString: false, parserValidationErrors: ["domain-to-ASCII"] },
  { input: "https://_dmarc.example.com/", validURLString: false, parserValidationErrors: ["domain-to-ASCII"] },
  { input: "https://example.com./", validURLString: false, parserValidationErrors: ["domain-to-ASCII"] },
  { input: "https://a_b.com/", validURLString: false, parserValidationErrors: ["domain-to-ASCII"] },
  { input: "https://a-.com/", validURLString: false, parserValidationErrors: ["domain-to-ASCII"] },

  // IPv6 address strings.
  { input: "https://[ABCD:EF01:2345:6789:ABCD:EF01:2345:6789]/", validURLString: true },
  { input: "https://[abcd:ef01:2345:6789:ABCD:EF01:2345:6789]/", validURLString: true },
  { input: "https://[2001:DB8:0:0:8:800:200C:417A]/", validURLString: true },
  { input: "https://[FF01:0:0:0:0:0:0:101]/", validURLString: true },
  { input: "https://[0:0:0:0:0:0:0:1]/", validURLString: true },
  { input: "https://[0:0:0:0:0:0:0:0]/", validURLString: true },
  { input: "https://[2001:DB8::8:800:200C:417A]/", validURLString: true },
  { input: "https://[FF01::101]/", validURLString: true },
  { input: "https://[::1]/", validURLString: true },
  { input: "https://[::]/", validURLString: true },
  { input: "https://[0:0:0:0:0:0:13.1.68.3]/", validURLString: true },
  { input: "https://[0:0:0:0:0:FFFF:129.144.52.38]/", validURLString: true },
  { input: "https://[::13.1.68.3]/", validURLString: true },
  { input: "https://[::FFFF:129.144.52.38]/", validURLString: true },
  { input: "https://[1:2:3:4:5:6:1.2.3.4]/", validURLString: true },
  { input: "https://[1:2:3:4:5:6:7::]/", validURLString: true },
  { input: "https://[::1:2:3:4:5:6:7]/", validURLString: true },
  { input: "https://[::2:3:4:5:6:7:8]/", validURLString: true },

  {
    input: "https://[::1",
    validURLString: false,
    parserValidationErrors: ["IPv6-unclosed"],
    parserFailure: true
  },
  {
    input: "https://[1:2:3:4:5:6:7]/",
    validURLString: false,
    parserValidationErrors: ["IPv6-too-few-pieces"],
    parserFailure: true
  },
  {
    input: "https://[1:2:3:4:5:6:7:8:9]/",
    validURLString: false,
    parserValidationErrors: ["IPv6-too-many-pieces"],
    parserFailure: true
  },
  {
    input: "https://[1:2:3:4:5:6:7:8:9]",
    validURLString: false,
    parserValidationErrors: ["IPv6-too-many-pieces"],
    parserFailure: true
  },
  {
    input: "https://[1::2::3]/",
    validURLString: false,
    parserValidationErrors: ["IPv6-multiple-compression"],
    parserFailure: true
  },
  {
    input: "https://[1::1::1]",
    validURLString: false,
    parserValidationErrors: ["IPv6-multiple-compression"],
    parserFailure: true
  },
  {
    input: "https://[1:2:3:4:5:6:7::8]/",
    validURLString: false,
    parserValidationErrors: ["IPv6-too-many-pieces"],
    parserFailure: true
  },
  {
    input: "https://[12345::]/",
    validURLString: false,
    parserValidationErrors: ["IPv6-invalid-code-point"],
    parserFailure: true
  },
  {
    input: "https://[1:2:3!:4]",
    validURLString: false,
    parserValidationErrors: ["IPv6-invalid-code-point"],
    parserFailure: true
  },
  { input: "https://[0DB8::1]/", validURLString: false, parserValidationErrors: ["IPv6-piece-leading-zero"] },
  {
    input: "https://[0DB8:0:0:0:0:0:0:1]/",
    validURLString: false,
    parserValidationErrors: ["IPv6-piece-leading-zero"]
  },
  { input: "https://[::01]/", validURLString: false, parserValidationErrors: ["IPv6-piece-leading-zero"] },
  { input: "https://[::01]", validURLString: false, parserValidationErrors: ["IPv6-piece-leading-zero"] },
  {
    input: "https://[:1]/",
    validURLString: false,
    parserValidationErrors: ["IPv6-invalid-compression"],
    parserFailure: true
  },
  {
    input: "https://[:1]",
    validURLString: false,
    parserValidationErrors: ["IPv6-invalid-compression"],
    parserFailure: true
  },
  {
    input: "https://[1:]/",
    validURLString: false,
    parserValidationErrors: ["IPv6-invalid-code-point"],
    parserFailure: true
  },
  {
    input: "https://[1:2:3]",
    validURLString: false,
    parserValidationErrors: ["IPv6-too-few-pieces"],
    parserFailure: true
  },
  {
    input: "https://[::ffff:192.168.000.1]/",
    validURLString: false,
    parserValidationErrors: ["IPv4-in-IPv6-invalid-code-point"],
    parserFailure: true
  },
  {
    input: "https://[ffff::127.00.0.1]",
    validURLString: false,
    parserValidationErrors: ["IPv4-in-IPv6-invalid-code-point"],
    parserFailure: true
  },
  {
    input: "https://[::ffff:192.168.0.256]/",
    validURLString: false,
    parserValidationErrors: ["IPv4-in-IPv6-out-of-range-part"],
    parserFailure: true
  },
  {
    input: "https://[ffff::127.0.0.4000]",
    validURLString: false,
    parserValidationErrors: ["IPv4-in-IPv6-out-of-range-part"],
    parserFailure: true
  },
  {
    input: "https://[::ffff:192.168.0]/",
    validURLString: false,
    parserValidationErrors: ["IPv4-in-IPv6-too-few-parts"],
    parserFailure: true
  },
  {
    input: "https://[ffff::127.0.0]",
    validURLString: false,
    parserValidationErrors: ["IPv4-in-IPv6-too-few-parts"],
    parserFailure: true
  },
  {
    input: "https://[192.168.0.1]/",
    validURLString: false,
    parserValidationErrors: ["IPv6-too-few-pieces"],
    parserFailure: true
  },
  {
    input: "https://[1:2:3:4:5:6:7:1.2.3.4]/",
    validURLString: false,
    parserValidationErrors: ["IPv4-in-IPv6-too-many-pieces"],
    parserFailure: true
  },
  {
    input: "https://[1:1:1:1:1:1:1:127.0.0.1]",
    validURLString: false,
    parserValidationErrors: ["IPv4-in-IPv6-too-many-pieces"],
    parserFailure: true
  },
  {
    input: "https://[1:2:3:4:5:6:7:8::]/",
    validURLString: false,
    parserValidationErrors: ["IPv6-too-many-pieces"],
    parserFailure: true
  },
  {
    input: "https://[::13.1.068.3]/",
    validURLString: false,
    parserValidationErrors: ["IPv4-in-IPv6-invalid-code-point"],
    parserFailure: true
  },
  {
    input: "https://[::1.2.3.4.5]/",
    validURLString: false,
    parserValidationErrors: ["IPv4-in-IPv6-invalid-code-point"],
    parserFailure: true
  },

  // Port strings.
  { input: "https://example.com:/", validURLString: true },
  { input: "https://example.com:", validURLString: true },
  { input: "https://example.com:00080/", validURLString: true },
  { input: "https://example.com:65535/", validURLString: true },
  {
    input: "https://example.com:65536/",
    validURLString: false,
    parserValidationErrors: ["port-out-of-range"],
    parserFailure: true
  },
  {
    input: "https://example.org:70000",
    validURLString: false,
    parserValidationErrors: ["port-out-of-range"],
    parserFailure: true
  },
  {
    input: "https://example.com:8x/",
    validURLString: false,
    parserValidationErrors: ["port-invalid"],
    parserFailure: true
  },
  {
    input: "https://example.org:7z",
    validURLString: false,
    parserValidationErrors: ["port-invalid"],
    parserFailure: true
  },

  // Opaque host strings.
  { input: "foo://h%40x", validURLString: true },
  { input: "foo://a~b!c", validURLString: true },
  { input: "foo://[::1]:80", validURLString: true },
  { input: "foo://h/x", validURLString: true },

  // Path segment strings.
  { input: "https://example.com/.", validURLString: true },
  { input: "https://example.com/..", validURLString: true },
  { input: "https://example.com//", validURLString: true },
  { input: "https://example.com///path", validURLString: true },
  { input: "https://example.com/%2e%2e", validURLString: true },
  { input: "https://example.com/a%2Fb", validURLString: true },
  { input: "https://example.com/a%2", validURLString: false, parserValidationErrors: ["invalid-URL-unit"] },
  { input: "https://example.com/a%2g", validURLString: false, parserValidationErrors: ["invalid-URL-unit"] },
  { input: "https://example.org/>", validURLString: false, parserValidationErrors: ["invalid-URL-unit"] },
  { input: "https://example.org/%s", validURLString: false, parserValidationErrors: ["invalid-URL-unit"] },
  { input: "https://example.com/a\\b", validURLString: false, parserValidationErrors: ["invalid-reverse-solidus"] },
  { input: "https://example.org\\", validURLString: false, parserValidationErrors: ["invalid-reverse-solidus"] },

  // Opaque path strings.
  { input: "foo:bar baz", validURLString: false, parserValidationErrors: ["invalid-URL-unit"] }
];

describe("URL validation", () => {
  test("test cases cover every named validation error", () => {
    const coveredErrors = new Set();
    for (const testCase of validationTestCases) {
      for (const validationError of testCase.parserValidationErrors ?? []) {
        coveredErrors.add(validationError);
      }
    }

    assert.deepStrictEqual([...coveredErrors].sort(), validationErrorNames.toSorted());
  });

  for (const testCase of validationTestCases) {
    test(testName(testCase), () => {
      const options = optionsFor(testCase);

      assert.equal(isValidURLString(testCase.input, options), testCase.validURLString);

      const { url, validationErrors } = parseURLWithValidationErrors(testCase.input, options);

      assert.equal(url === null, testCase.parserFailure === true, "parser failure result");
      assert.deepStrictEqual(validationErrors, testCase.parserValidationErrors ?? []);
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
