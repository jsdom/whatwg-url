import path from "node:path";

import WebIDL2JS from "webidl2js";

const dir = path.resolve(import.meta.dirname, "../lib");

const transformer = new WebIDL2JS({ implSuffix: "-impl" });

transformer.addSource(dir, dir);
await transformer.generate(dir);
