"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { URL, parseURL, serializeURLOrigin } = require("..");

test("new URL gives a null origin for file URLs", () => {
  const url = new URL("file:///C:/demo");
  assert.equal(url.origin, "null");
});

test("serializeURLOrigin gives a null origin for file URLs", () => {
  const urlRecord = parseURL("file:///C:/demo");
  const origin = serializeURLOrigin(urlRecord);
  assert.equal(origin, "null");
});
