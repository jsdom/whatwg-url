"use strict";
const fs = require("fs");
const path = require("path");
const webidl2js = require("webidl2js");

const idlFilePath = path.resolve(__dirname, "../src/URL.idl");
const outputDir = path.resolve(__dirname, "../lib");
const implDir = path.resolve(__dirname, "../lib");

const src = fs.readFileSync(idlFilePath, { encoding: "utf-8" });
webidl2js.generate(src, outputDir, implDir, { implSuffix: "-impl" });
