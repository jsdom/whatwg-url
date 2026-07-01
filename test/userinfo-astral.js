"use strict";
const test = require("node:test");
const assert = require("node:assert");
const { URL } = require("..");

test("astral code point in userinfo encodes each username code point once", () => {
  assert.strictEqual(new URL("http://\u{1F600}x@host/").username, "%F0%9F%98%80x");
});

test("two consecutive astral code points in userinfo encode fully", () => {
  assert.strictEqual(new URL("http://\u{1F600}\u{1F600}@host/").username, "%F0%9F%98%80%F0%9F%98%80");
});

test("astral code point in password encodes each code point once", () => {
  assert.strictEqual(new URL("http://user:\u{1F600}pw@host/").password, "%F0%9F%98%80pw");
});

test("astral code point mid-userinfo does not drop the trailing character", () => {
  assert.strictEqual(
    new URL("https://alice\u{1F642}bob@example.com/").href,
    "https://alice%F0%9F%99%82bob@example.com/"
  );
});
