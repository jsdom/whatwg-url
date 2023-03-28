"use strict";
const assert = require("assert");

/* eslint-disable camelcase */
module.exports = {
  test(func, name) {
    // This particular test has a FormData dependency which we currently don't mock.
    if (name === "URLSearchParams constructor, FormData.") {
      test.skip(name, func);
    } else {
      test(name || "[single-file test]", func);
    }
  },

  promise_test() {
    // No-op; the only place this is used in WPT is not applicable to our usage.
  },

  assert_true(actual) {
    assert.strictEqual(actual, true);
  },

  assert_false(actual) {
    assert.strictEqual(actual, false);
  },

  assert_equals(actual, expected) {
    assert.strictEqual(actual, expected);
  },

  assert_array_equals(actual, expected) {
    assert.deepStrictEqual([...actual], [...expected]);
  },

  assert_throws_js(errorConstructor, func) {
    // Don't bother testing the errorConstructor since that brings in tricky realm issues.
    assert.throws(func);
  },

  assert_unreached() {
    assert(false);
  },

  subsetTestByKey(key, testRunnerFunc, func, name) {
    // Don't do any keying stuff.
    testRunnerFunc(func, name);
  }
};
