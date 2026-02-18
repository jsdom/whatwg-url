"use strict";
const test = require("node:test");
const assert = require("node:assert");
const { URL } = require("..");

// Regression test for https://github.com/jsdom/whatwg-url/issues/315.
test("Ensure URL.parse returns an instance of URL", () => {
  const url = URL.parse("https://example.com");
  assert(url instanceof URL);
});
