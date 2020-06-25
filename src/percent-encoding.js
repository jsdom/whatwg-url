"use strict";
const { isASCIIHex } = require("./infra");
const { utf8Encode } = require("./encoding");

function p(char) {
  return char.codePointAt(0);
}

// https://whatpr.org/url/518.html#percent-encode
function percentEncode(c) {
  let hex = c.toString(16).toUpperCase();
  if (hex.length === 1) {
    hex = "0" + hex;
  }

  return "%" + hex;
}

// https://whatpr.org/url/518.html#percent-decode
function percentDecodeBytes(input) {
  const output = new Uint8Array(input.byteLength);
  let outputIndex = 0;
  for (let i = 0; i < input.byteLength; ++i) {
    const byte = input[i];
    if (byte !== 0x25) {
      output[outputIndex++] = byte;
    } else if (byte === 0x25 && (!isASCIIHex(input[i + 1]) || !isASCIIHex(input[i + 2]))) {
      output[outputIndex++] = byte;
    } else {
      const bytePoint = parseInt(String.fromCodePoint(input[i + 1], input[i + 2]), 16);
      output[outputIndex++] = bytePoint;
      i += 2;
    }
  }

  return output.slice(0, outputIndex);
}

// https://whatpr.org/url/518.html#string-percent-decode
function percentDecodeString(input) {
  const bytes = utf8Encode(input);
  return percentDecodeBytes(bytes);
}

// https://whatpr.org/url/518.html#c0-control-percent-encode-set
function isC0ControlPercentEncode(c) {
  return c <= 0x1F || c > 0x7E;
}

// https://whatpr.org/url/518.html#fragment-percent-encode-set
const extraFragmentPercentEncodeSet = new Set([p(" "), p("\""), p("<"), p(">"), p("`")]);
function isFragmentPercentEncode(c) {
  return isC0ControlPercentEncode(c) || extraFragmentPercentEncodeSet.has(c);
}

// https://whatpr.org/url/518.html#query-percent-encode-set
const extraQueryPercentEncodeSet = new Set([p(" "), p("\""), p("#"), p("<"), p(">")]);
function isQueryPercentEncode(c) {
  return isC0ControlPercentEncode(c) || extraQueryPercentEncodeSet.has(c);
}

// https://whatpr.org/url/518.html#special-query-percent-encode-set
function isSpecialQueryPercentEncode(c) {
  return isQueryPercentEncode(c) || c === p("'");
}

// https://whatpr.org/url/518.html#path-percent-encode-set
const extraPathPercentEncodeSet = new Set([p("?"), p("`"), p("{"), p("}")]);
function isPathPercentEncode(c) {
  return isQueryPercentEncode(c) || extraPathPercentEncodeSet.has(c);
}

// https://whatpr.org/url/518.html#userinfo-percent-encode-set
const extraUserinfoPercentEncodeSet =
  new Set([p("/"), p(":"), p(";"), p("="), p("@"), p("["), p("\\"), p("]"), p("^"), p("|")]);
function isUserinfoPercentEncode(c) {
  return isPathPercentEncode(c) || extraUserinfoPercentEncodeSet.has(c);
}

// https://whatpr.org/url/518.html#application-x-www-form-urlencoded-percent-encode-set
const extraURLEncodedPercentEncodeSet = new Set([
  p("!"), p("$"), p("%"), p("&"), p("'"),
  p("("), p(")"), p("+"), p(","), p("~")
]);
function isURLEncodedPercentEncode(c) {
  return isUserinfoPercentEncode(c) || extraURLEncodedPercentEncodeSet.has(c);
}

// https://whatpr.org/url/518.html#code-point-percent-encode-after-encoding
// https://whatpr.org/url/518.html#utf-8-percent-encode
// Assuming encoding is always utf-8 allows us to trim one of the logic branches. TODO: support encoding.
// The "-Internal" variant here has code points as JS strings. The external version used by other files has code points
// as JS numbers, like the rest of the codebase.
function utf8PercentEncodeCodePointInternal(codePoint, percentEncodePredicate) {
  const bytes = utf8Encode(codePoint);
  let output = "";
  for (const byte of bytes) {
    // Our percentEncodePredicate operates on bytes, not code points, so this is slightly different from the spec.
    if (!percentEncodePredicate(byte)) {
      output += String.fromCharCode(byte);
    } else {
      output += percentEncode(byte);
    }
  }

  return output;
}

function utf8PercentEncodeCodePoint(codePoint, percentEncodePredicate) {
  return utf8PercentEncodeCodePointInternal(String.fromCodePoint(codePoint), percentEncodePredicate);
}

// https://whatpr.org/url/518.html#string-percent-encode-after-encoding
// https://whatpr.org/url/518.html#string-utf-8-percent-encode
function utf8PercentEncodeString(input, percentEncodePredicate, spaceAsPlus = false) {
  let output = "";
  for (const codePoint of input) {
    if (spaceAsPlus && codePoint === " ") {
      output += "+";
    } else {
      output += utf8PercentEncodeCodePointInternal(codePoint, percentEncodePredicate);
    }
  }
  return output;
}

module.exports = {
  isC0ControlPercentEncode,
  isFragmentPercentEncode,
  isQueryPercentEncode,
  isSpecialQueryPercentEncode,
  isPathPercentEncode,
  isUserinfoPercentEncode,
  isURLEncodedPercentEncode,
  percentDecodeString,
  percentDecodeBytes,
  utf8PercentEncodeString,
  utf8PercentEncodeCodePoint
};
