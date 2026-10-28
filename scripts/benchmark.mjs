import { Bench } from "tinybench";

import { URL } from "../index.js";
import testData from "../test/web-platform-tests/resources/urltestdata.json" with { type: "json" };

const testInputs = testData.filter((c) => typeof c === "object").map((c) => c.input);

const bench = new Bench({ throws: true });

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

await bench.run();
console.table(bench.table());
