"use strict";
const { URL } = require("../");
const Benchmark = require("benchmark");

const testData = require("../test/web-platform-tests/resources/urltestdata.json");
const testInputs = testData.filter(c => typeof c === "object").map(c => c.input);

runBenchmark("URL constructor with WPT data", () => {
  for (const input of testInputs) {
    try {
      // eslint-disable-next-line no-new
      new URL(input);
    } catch {
      // intentionally empty
    }
  }
});

runBenchmark("long input not starting or ending with control characters (GH-286)", () => {
  try {
    // eslint-disable-next-line no-new
    new URL(`!!${"\u0000".repeat(100000)}A\rA`);
  } catch {
    // intentionally empty
  }
});

function runBenchmark(name, fn) {
  new Benchmark(name, fn, {
    onComplete(event) {
      console.log(`${name}:`);
      console.log(`  ${event.target.hz.toFixed(0)} ops/second`);
      console.log(`  ±${event.target.stats.rme.toFixed(2)}% relative margin of error`);
      console.log(`  ${event.target.stats.sample.length} samples`);
      console.log("");
    }
  }).run();
}
