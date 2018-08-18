"use strict";
const path = require("path");
const Transformer = require("webidl2js");

const srcDir = path.resolve(__dirname, "../src");
const implDir = path.resolve(__dirname, "../lib");
const outputDir = path.resolve(__dirname, "../lib");

const transformer = new Transformer({
  implSuffix: "-impl"
});

transformer.addSource(srcDir, implDir);
transformer.generate(outputDir)
  .catch(err => {
    console.error(err.stack);
    process.exit(1);
  });
