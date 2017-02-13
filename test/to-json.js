"use strict";
const assert = require("assert");
const URL = require("..").URL;

specify("toJSON() works as expected", () => {
  const u = new URL("/", "https://developer.mozilla.org");
  assert.strictEqual(u.toJSON(), "https://developer.mozilla.org/");
  assert.strictEqual(JSON.stringify(u), "\"https://developer.mozilla.org/\"");
});
