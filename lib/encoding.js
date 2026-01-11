"use strict";
const { normalizeEncoding } = require("@exodus/bytes/encoding.js");
const { createSinglebyteEncoder } = require("@exodus/bytes/single-byte.js");
const { createMultibyteEncoder } = require("@exodus/bytes/multi-byte.js");
const { utf8fromStringLoose, utf8toStringLoose } = require("@exodus/bytes/utf8.js");

const singleByteEncodings = new Set([
  "ibm866",
  "iso-8859-2",
  "iso-8859-3",
  "iso-8859-4",
  "iso-8859-5",
  "iso-8859-6",
  "iso-8859-7",
  "iso-8859-8",
  "iso-8859-8-i",
  "iso-8859-10",
  "iso-8859-13",
  "iso-8859-14",
  "iso-8859-15",
  "iso-8859-16",
  "koi8-r",
  "koi8-u",
  "macintosh",
  "windows-874",
  "windows-1250",
  "windows-1251",
  "windows-1252",
  "windows-1253",
  "windows-1254",
  "windows-1255",
  "windows-1256",
  "windows-1257",
  "windows-1258",
  "x-mac-cyrillic"
]);

const multiByteEncodings = new Set([
  "big5",
  "euc-kr",
  "euc-jp",
  "shift_jis",
  "gbk",
  "gb18030"
  // Note: iso-2022-jp encoding is not supported by @exodus/bytes
]);

function utf8Encode(string) {
  return utf8fromStringLoose(string);
}

function utf8DecodeWithoutBOM(bytes) {
  return utf8toStringLoose(bytes);
}

// https://encoding.spec.whatwg.org/#concept-encoding-get
// Combined with https://encoding.spec.whatwg.org/#get-an-output-encoding
function getEncoder(encoding) {
  const normalized = normalizeEncoding(encoding);

  // https://encoding.spec.whatwg.org/#get-an-output-encoding
  if (normalized === "utf-8" || normalized === "replacement" ||
      normalized === "utf-16le" || normalized === "utf-16be") {
    return utf8fromStringLoose;
  }

  if (singleByteEncodings.has(normalized)) {
    return createSinglebyteEncoder(normalized);
  }

  if (multiByteEncodings.has(normalized)) {
    return createMultibyteEncoder(normalized);
  }

  throw new RangeError(`"${normalized}" is not a supported encoding for encoding`);
}

module.exports = {
  utf8Encode,
  utf8DecodeWithoutBOM,
  getEncoder
};
