"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { URL } = require("..");

test("constructor is a non-special scheme", () => {
  const opaque = new URL("constructor:example");
  assert.equal(opaque.href, "constructor:example");
  assert.equal(opaque.origin, "null");
  const hierarchical = new URL("constructor://host:80/path");
  assert.equal(hierarchical.href, "constructor://host:80/path");
  assert.equal(hierarchical.port, "80");
  assert.equal(new URL("https://host:443/path").port, "");
});
