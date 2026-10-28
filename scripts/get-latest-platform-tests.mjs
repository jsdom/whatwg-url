import fs from "node:fs/promises";
import path from "node:path";

import { directlyRunnableTests, resourceDependentTests } from "../test/web-platform-test-files.mjs";

if (process.env.NO_UPDATE) {
  process.exit(0);
}

// Pin to specific version, reflecting the spec version in the readme.
//
// To get the latest commit:
// 1. Go to https://github.com/web-platform-tests/wpt/tree/master/url
// 2. Press "y" on your keyboard to get a permalink
// 3. Copy the commit hash
const commitHash = "cfb4a4b0bb480522d095557b16d86a15d6897e35";

const urlPrefix = `https://raw.githubusercontent.com/web-platform-tests/wpt/${commitHash}/url/`;
const targetDir = path.resolve(import.meta.dirname, "..", "test", "web-platform-tests");

// These resources we download, but the test runner doesn't need to know about them.
const resources = [
  "resources/percent-encoding.json",
  "resources/setters_tests.json",
  "resources/toascii.json",
  "resources/urltestdata.json",
  "resources/urltestdata-javascript-only.json",
  "resources/IdnaTestV2.json",
  "resources/IdnaTestV2-removed.json",
];

await fs.rm(targetDir, { recursive: true, force: true, maxRetries: 5 });
await fs.mkdir(path.resolve(targetDir, "resources"), { recursive: true });

await Promise.all(
  [...resources, ...directlyRunnableTests, ...resourceDependentTests].map(async (file) => {
    const res = await fetch(`${urlPrefix}${file}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${res.url}: ${res.status}`);
    }
    await fs.writeFile(path.resolve(targetDir, file), res.body);
  }),
);
