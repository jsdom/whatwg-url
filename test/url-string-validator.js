"use strict";
const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

const { isValidURLString, parseURL, parseURLWithValidationErrors } = require("..");

function baseURL(input) {
  const url = parseURL(input);
  assert.notEqual(url, null, "The base URL must parse successfully");
  return url;
}

describe("isValidURLString", () => {
  const validAbsoluteURLStrings = [
    "https://example.com/",
    "https://example.com/././foo",
    "https://example.org/foo//bar",
    "https://EXAMPLE.com/../x",
    "https://☕.example/",
    "https://example.255/",
    "https://example/%25?%25#%25",
    "https://[::1]/",
    "https://127.0.0.1/",
    "file:///C:/demo",
    "hello:world",
    "foo://",
    "foo:///path",
    "foo://example:65535/path?query#fragment"
  ];

  for (const input of validAbsoluteURLStrings) {
    test(`${input} is a valid absolute URL string`, () => {
      assert.equal(isValidURLString(input), true);
    });
  }

  const invalidAbsoluteURLStrings = [
    "https:example.org",
    "https://////example.com///",
    "file:///C|/demo",
    "https://user:password@example.org/",
    "https://example.org/foo bar",
    "https://ex ample.org/",
    "https://example.com:demo",
    "https://example.com:65536",
    "http://[www.example.com]/",
    "https://example.org//",
    "https://[1:2:3]/",
    "https://example.com/[]?[]#[]",
    "https://example/%?%#%",
    "https://%30/",
    "https://xn--8i7caa/",
    "foo://exa[mple.org",
    "foo://:80",
    "foo:////bar"
  ];

  for (const input of invalidAbsoluteURLStrings) {
    test(`${input} is not a valid absolute URL string`, () => {
      assert.equal(isValidURLString(input), false);
    });
  }

  test("relative URL strings require a base URL", () => {
    assert.equal(isValidURLString("example"), false);
    assert.equal(isValidURLString("example", { baseURL: baseURL("https://example.com/demo") }), true);
  });

  test("relative URL strings are validated using the base URL's scheme", () => {
    assert.equal(isValidURLString("//example.com/path", { baseURL: baseURL("https://example.com/") }), true);
    assert.equal(isValidURLString("/path", { baseURL: baseURL("https://example.com/") }), true);
    assert.equal(isValidURLString("path/../file", { baseURL: baseURL("https://example.com/") }), true);
    assert.equal(isValidURLString("\\example\\path", { baseURL: baseURL("https://example.com/") }), false);
    assert.equal(isValidURLString("foo/%", { baseURL: baseURL("https://example.com/") }), false);
  });

  test("file URL relative strings depend on the base URL's host", () => {
    assert.equal(isValidURLString("/C:/path", { baseURL: baseURL("file:///tmp/") }), true);
    assert.equal(isValidURLString("/C:/path", { baseURL: baseURL("file://server/tmp/") }), false);
    assert.equal(isValidURLString("../path", { baseURL: baseURL("file://server/tmp/") }), true);
  });

  test("IPv6 address strings follow the RFC 4291 text representation forms", () => {
    const valid = [
      "https://[ABCD:EF01:2345:6789:ABCD:EF01:2345:6789]/",
      "https://[2001:DB8:0:0:8:800:200C:417A]/",
      "https://[2001:DB8::8:800:200C:417A]/",
      "https://[FF01::101]/",
      "https://[::]/",
      "https://[0:0:0:0:0:0:13.1.68.3]/",
      "https://[::13.1.68.3]/",
      "https://[::FFFF:129.144.52.38]/",
      "https://[1:2:3:4:5:6:7::]/",
      "https://[::1:2:3:4:5:6:7]/"
    ];

    for (const input of valid) {
      assert.equal(isValidURLString(input), true, input);
    }

    const invalid = [
      "https://[1:2:3:4:5:6:7]/",
      "https://[1:2:3:4:5:6:7:8:9]/",
      "https://[1::2::3]/",
      "https://[1:2:3:4:5:6:7::8]/",
      "https://[12345::]/",
      "https://[:1]/",
      "https://[1:]/",
      "https://[::ffff:192.168.000.1]/",
      "https://[::ffff:192.168.0.256]/",
      "https://[::ffff:192.168.0]/",
      "https://[192.168.0.1]/"
    ];

    for (const input of invalid) {
      assert.equal(isValidURLString(input), false, input);
    }
  });

  test("query and fragment strings must be URL units", () => {
    const base = baseURL("https://example.com/");

    assert.equal(isValidURLString("?q=%25#fragment", { baseURL: base }), true);
    assert.equal(isValidURLString("?q=%#fragment", { baseURL: base }), false);
    assert.equal(isValidURLString("?q#frag%25", { baseURL: base }), true);
    assert.equal(isValidURLString("?q#frag%", { baseURL: base }), false);
  });

  test("URL-writing validity is separate from parser validation errors", () => {
    const grammarInvalidParserValid = [
      "file://loc%61lhost/",
      "https://%30/",
      "https://example.org//"
    ];

    for (const input of grammarInvalidParserValid) {
      const { url, validationErrors } = parseURLWithValidationErrors(input);

      assert.notEqual(url, null, input);
      assert.deepStrictEqual(validationErrors, [], input);
      assert.equal(isValidURLString(input), false, input);
    }

    // A "valid domain string" only runs the domain parser, so a host that looks like an IPv4
    // address is grammar-valid even though host parsing later rejects it as a bad IPv4 address.
    const grammarValidParserInvalid = [
      ["https://example.255/", ["IPv4-non-numeric-part"]],
      ["https://1.2.3.4.5/", ["IPv4-too-many-parts"]],
      ["https://256.1.1.1/", ["IPv4-out-of-range-part"]]
    ];

    for (const [input, expectedErrors] of grammarValidParserInvalid) {
      const { url, validationErrors } = parseURLWithValidationErrors(input);

      assert.equal(url, null, input);
      assert.deepStrictEqual(validationErrors, expectedErrors, input);
      assert.equal(isValidURLString(input), true, input);
    }
  });

  test("documents current behavior for whatwg/url#905 examples", () => {
    // https://github.com/whatwg/url/pull/905 discusses changing these results. Until that PR
    // lands, assert the current behavior so any later update is intentional.
    const cases = [
      "https://exam%70le.org",
      "https://_dmarc.example.com",
      "foo:bar baz",
      "foo:a:b"
    ];

    for (const input of cases) {
      const { url, validationErrors } = parseURLWithValidationErrors(input);

      assert.notEqual(url, null, input);
      assert.deepStrictEqual(validationErrors, [], input);
      assert.equal(isValidURLString(input), false, input);
    }
  });

  // "Valid domain" runs the domain parser with beStrict = true, which is stricter than the
  // non-strict domain parsing the URL parser itself uses. These hosts therefore parse fine but
  // are not valid URL strings.
  test("host strings are validated with strict domain-to-ASCII", () => {
    const invalid = [
      "https://example.com./", // trailing empty label rejected by VerifyDnsLength
      "https://a_b.com/", // U+005F (_) rejected by UseSTD3ASCIIRules
      "https://a-.com/" // label ending in U+002D (-) rejected by CheckHyphens
    ];

    for (const input of invalid) {
      assert.notEqual(parseURL(input), null, `${input} should still parse`);
      assert.equal(isValidURLString(input), false, input);
    }
  });

  // Per RFC 4291 §2.2, referenced by the "valid IPv6-address string" definition.
  test("IPv6 address strings accept the RFC 4291 §2.2 example forms", () => {
    const valid = [
      // Preferred form, expanded forms, and their compressed equivalents.
      "https://[ABCD:EF01:2345:6789:ABCD:EF01:2345:6789]/",
      "https://[FF01:0:0:0:0:0:0:101]/",
      "https://[0:0:0:0:0:0:0:1]/",
      "https://[0:0:0:0:0:0:0:0]/",
      "https://[2001:DB8::8:800:200C:417A]/",
      "https://[FF01::101]/",
      "https://[::1]/",
      "https://[::]/",
      // Mixed IPv4 form, expanded and compressed.
      "https://[0:0:0:0:0:0:13.1.68.3]/",
      "https://[0:0:0:0:0:FFFF:129.144.52.38]/",
      "https://[::13.1.68.3]/",
      "https://[::FFFF:129.144.52.38]/",
      "https://[1:2:3:4:5:6:1.2.3.4]/",
      // Leading zeros within a field and mixed-case hex are permitted.
      "https://[0DB8:0:0:0:0:0:0:1]/",
      "https://[abcd:ef01:2345:6789:ABCD:EF01:2345:6789]/",
      // "::" may compress a single zero group ("one or more groups").
      "https://[1:2:3:4:5:6:7::]/",
      "https://[::2:3:4:5:6:7:8]/"
    ];

    for (const input of valid) {
      assert.equal(isValidURLString(input), true, input);
    }

    const invalid = [
      "https://[12345::]/", // field longer than four hex digits
      "https://[1:2:3:4:5:6:7:1.2.3.4]/", // seven hex pieces plus an embedded IPv4 address
      "https://[1:2:3:4:5:6:7:8::]/", // eight pieces leave no group for "::" to compress
      "https://[::13.1.068.3]/", // leading zero in an embedded IPv4 octet
      "https://[::1.2.3.4.5]/" // five-octet embedded IPv4 address
    ];

    for (const input of invalid) {
      assert.equal(isValidURLString(input), false, input);
    }
  });

  test("file URL strings require \"//\" and forbid ports", () => {
    const valid = [
      "file:///", // empty host followed by a path-absolute string
      "file:///path",
      "file://host",
      "file://host/",
      "file://host/path",
      "file://host/C:" // not a Windows drive letter path: no trailing slash
    ];

    for (const input of valid) {
      assert.equal(isValidURLString(input), true, input);
    }

    const invalid = [
      "file:", // no "//"
      "file:/path", // single slash, no "//"
      "file://", // empty host and no path
      "file:////path", // "//path" is not a path-absolute string
      "file://host:80/", // file URLs have no port in the grammar
      "file://host/C:/demo" // drive letter path is excluded when a host is present
    ];

    for (const input of invalid) {
      assert.equal(isValidURLString(input), false, input);
    }
  });

  test("URL-port strings may be empty or carry leading zeros", () => {
    assert.equal(isValidURLString("https://example.com:/"), true);
    assert.equal(isValidURLString("https://example.com:"), true);
    assert.equal(isValidURLString("https://example.com:00080/"), true);
    assert.equal(isValidURLString("https://example.com:65535/"), true);
    assert.equal(isValidURLString("https://example.com:65536/"), false);
    assert.equal(isValidURLString("https://example.com:8x/"), false);
  });

  test("opaque host strings are URL units excluding forbidden host code points", () => {
    assert.equal(isValidURLString("foo://h%40x"), true); // percent-encoded "@"
    assert.equal(isValidURLString("foo://a~b!c"), true);
    assert.equal(isValidURLString("foo://[::1]:80"), true); // opaque hosts may be IPv6
    assert.equal(isValidURLString("foo://h/x"), true);
    assert.equal(isValidURLString("foo://h@x"), false); // "@" is a forbidden host code point
    assert.equal(isValidURLString("hello:foo:bar"), false); // body begins with a scheme, so not scheme-less
  });

  test("fragment and query code points must be URL units", () => {
    // U+00A0 is the lowest non-ASCII URL code point; the range runs up to U+10FFFD.
    assert.equal(isValidURLString("https://example.com/# "), true);
    assert.equal(isValidURLString("https://example.com/#\u{1F600}"), true);
    assert.equal(isValidURLString("https://example.com/#\u{10FFFD}"), true);

    // Excluded: C1 controls, U+007F, noncharacters, and surrogates.
    assert.equal(isValidURLString("https://example.com/#"), false);
    assert.equal(isValidURLString("https://example.com/#"), false);
    assert.equal(isValidURLString("https://example.com/#﷐"), false);
    assert.equal(isValidURLString("https://example.com/#￿"), false);
    assert.equal(isValidURLString("https://example.com/#\u{10FFFF}"), false);
    assert.equal(isValidURLString("https://example.com/#\uD800"), false);
  });

  test("URL-path-segment strings exclude raw \"/\" and \"?\" but allow their encodings", () => {
    assert.equal(isValidURLString("https://example.com/."), true);
    assert.equal(isValidURLString("https://example.com/.."), true);
    assert.equal(isValidURLString("https://example.com/%2e%2e"), true);
    assert.equal(isValidURLString("https://example.com/a%2Fb"), true); // %2F stays inside the segment
    assert.equal(isValidURLString("https://example.com/a%2"), false); // truncated percent sequence
    assert.equal(isValidURLString("https://example.com/a%2g"), false); // non-hex percent sequence
    assert.equal(isValidURLString("https://example.com/a\\b"), false); // "\\" is not a URL code point
  });
});
