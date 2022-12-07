"use strict";
const assert = require("assert");
const { URL } = require("..");

test("new URL gives a null origin for file URLs", () => {
  const url = new URL("h://.");
  assert.strictEqual(url.host, ".");
});
