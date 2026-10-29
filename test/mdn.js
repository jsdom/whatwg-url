"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { URL } = require("..");

test("Checking all examples on MDN pass", () => {
  const a = new URL("/", "https://developer.mozilla.org");
  assert.equal(a.href, "https://developer.mozilla.org/");

  const b = new URL("https://developer.mozilla.org");
  assert.equal(b.href, "https://developer.mozilla.org/");

  const c = new URL("en-US/docs", b);
  assert.equal(c.href, "https://developer.mozilla.org/en-US/docs");

  const d = new URL("/en-US/docs", b);
  assert.equal(d.href, "https://developer.mozilla.org/en-US/docs");

  const f = new URL("/en-US/docs", d);
  assert.equal(f.href, "https://developer.mozilla.org/en-US/docs");

  const g = new URL("/en-US/docs", "https://developer.mozilla.org/fr-FR/toto");
  assert.equal(g.href, "https://developer.mozilla.org/en-US/docs");

  const h = new URL("/en-US/docs", a);
  assert.equal(h.href, "https://developer.mozilla.org/en-US/docs");

  assert.throws(() => new URL("/en-US/docs", ""));
  assert.throws(() => new URL("/en-US/docs"));

  const k = new URL("http://www.example.com", "https://developers.mozilla.com");
  assert.equal(k.href, "http://www.example.com/");

  const l = new URL("http://www.example.com", b);
  assert.equal(l.href, "http://www.example.com/");
});
