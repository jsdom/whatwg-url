"use strict";
const { Bench } = require("tinybench");
const { URL } = require("../");

const testData = require("../test/web-platform-tests/resources/urltestdata.json");
const testInputs = testData.filter(c => typeof c === "object").map(c => c.input);

const bench = new Bench();

bench.add("URL constructor with WPT data", () => {
  for (const input of testInputs) {
    try {
      new URL(input); // eslint-disable-line no-new
    } catch {
      // intentionally empty
    }
  }
});

bench.add("long input not starting or ending with control characters (GH-286)", () => {
  try {
    new URL(`!!${"\u0000".repeat(100000)}A\rA`); // eslint-disable-line no-new
  } catch {
    // intentionally empty
  }
});

bench.run().then(() => {
  console.table(bench.table());
});
