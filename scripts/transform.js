"use strict";
const path = require("path");
const WebIDL2JS = require("webidl2js");

const dir = path.resolve(__dirname, "../lib");

const transformer = new WebIDL2JS({ implSuffix: "-impl" });

transformer.addSource(dir, dir);
transformer.generate(dir)
  .catch(err => {
    console.error(err.stack);
    process.exit(1);
  });
