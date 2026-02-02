"use strict";
const { utf8fromStringLoose, utf8toStringLoose } = require("@exodus/bytes/utf8.js");

function utf8Encode(string) {
  return utf8fromStringLoose(string);
}

function utf8DecodeWithoutBOM(bytes) {
  return utf8toStringLoose(bytes);
}

module.exports = {
  utf8Encode,
  utf8DecodeWithoutBOM
};
