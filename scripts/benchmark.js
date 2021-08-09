"use strict";
const { URL } = require("../");
const Benchmark = require("benchmark");
const testData = require("../test/web-platform-tests/resources/urltestdata.json");

const testInputs = testData.filter(c => typeof c === "object").map(c => c.input);

const benchmark = new Benchmark(() => {
  for (const input of testInputs) {
    try {
      // eslint-disable-next-line no-new
      new URL(input);
    } catch {
      // intentionally empty
    }
  }
});

benchmark.on("cycle", e => console.log(e.target.toString()));
benchmark.run();
