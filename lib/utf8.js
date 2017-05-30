"use strict";

function TextDecoder() {
}

TextDecoder.prototype.decode = function (bytes) {
  return Buffer.from(bytes).toString();
};

function TextEncoder() {
}

TextEncoder.prototype.encode = function (string) {
  return new Uint8Array(Buffer.from(string));
};

module.exports = {
  TextDecoder,
  TextEncoder
};
