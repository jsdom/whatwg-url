"use strict";

const tr46 = require("tr46");

const infra = require("./infra");

function p(char) {
  return char.codePointAt(0);
}

const failure = Symbol("failure");

const specialSchemes = {
  ftp: 21,
  file: null,
  http: 80,
  https: 443,
  ws: 80,
  wss: 443
};

const strictDomainToASCIIOptions = {
  checkHyphens: true,
  checkBidi: true,
  checkJoiners: true,
  useSTD3ASCIIRules: true,
  transitionalProcessing: false,
  verifyDNSLength: true,
  ignoreInvalidPunycode: false
};

const domainToASCIIOptions = {
  checkHyphens: false,
  checkBidi: true,
  checkJoiners: true,
  useSTD3ASCIIRules: false,
  transitionalProcessing: false,
  verifyDNSLength: false,
  ignoreInvalidPunycode: false
};

const urlCodePoints = new Set([
  p("!"), p("$"), p("&"), p("'"), p("("), p(")"), p("*"), p("+"), p(","), p("-"), p("."), p("/"),
  p(":"), p(";"), p("="), p("?"), p("@"), p("_"), p("~")
]);

const forbiddenHostCodePoints = new Set([
  0x00, 0x09, 0x0A, 0x0D, 0x20, p("#"), p("/"), p(":"), p("<"), p(">"), p("?"), p("@"), p("["),
  p("\\"), p("]"), p("^"), p("|")
]);

function isURLCodePoint(c) {
  return infra.isASCIIAlphanumeric(c) ||
    urlCodePoints.has(c) ||
    (c >= 0xA0 && c <= 0x10FFFD && (c < 0xD800 || c > 0xDFFF) && !infra.isNoncharacter(c));
}

function isInvalidURLCodePoint(c) {
  return !isURLCodePoint(c) && c !== p("%");
}

function isPercentEncodedByteAt(input, index) {
  return index + 2 < input.length &&
    input[index] === "%" &&
    infra.isASCIIHex(input.charCodeAt(index + 1)) &&
    infra.isASCIIHex(input.charCodeAt(index + 2));
}

function containsForbiddenHostCodePoint(string) {
  return [...string].some(c => forbiddenHostCodePoints.has(c.codePointAt(0)));
}

function containsForbiddenDomainCodePoint(string) {
  return [...string].some(c => {
    const cp = c.codePointAt(0);
    return forbiddenHostCodePoints.has(cp) || (cp >= 0x00 && cp <= 0x1F) || cp === p("%") || cp === 0x7F;
  });
}

function domainParser(domain, validationErrors = null, beStrict = false) {
  if (beStrict) {
    const result = tr46.toASCII(domain, strictDomainToASCIIOptions);
    if (result === null) {
      validationErrors?.push("domain-to-ASCII");
      return failure;
    }

    return result;
  }

  let result;
  if (infra.isASCIIString(domain)) {
    if (validationErrors !== null && tr46.toASCII(domain, domainToASCIIOptions) === null) {
      validationErrors.push("domain-to-ASCII");
    }

    result = domain.toLowerCase();
  } else {
    result = tr46.toASCII(domain, domainToASCIIOptions);
    if (result === null) {
      validationErrors?.push("domain-to-ASCII");
      return failure;
    }
  }

  if (result === "") {
    validationErrors?.push("domain-to-ASCII");
    return failure;
  }
  if (containsForbiddenDomainCodePoint(result)) {
    validationErrors?.push("domain-invalid-code-point");
    return failure;
  }

  return result;
}

function isSpecialScheme(scheme) {
  return specialSchemes[scheme.toLowerCase()] !== undefined;
}

function isSpecialSchemeExceptFile(scheme) {
  return isSpecialScheme(scheme) && scheme.toLowerCase() !== "file";
}

function defaultPort(scheme) {
  return specialSchemes[scheme.toLowerCase()];
}

function isWindowsDriveLetterCodePoints(cp1, cp2) {
  return infra.isASCIIAlpha(cp1) && (cp2 === p(":") || cp2 === p("|"));
}

function isWindowsDriveLetterString(string) {
  return string.length === 2 && infra.isASCIIAlpha(string.codePointAt(0)) && (string[1] === ":" || string[1] === "|");
}

function isNormalizedWindowsDriveLetterString(string) {
  return string.length === 2 && infra.isASCIIAlpha(string.codePointAt(0)) && string[1] === ":";
}

module.exports = {
  containsForbiddenHostCodePoint,
  defaultPort,
  domainParser,
  failure,
  forbiddenHostCodePoints,
  isInvalidURLCodePoint,
  isNormalizedWindowsDriveLetterString,
  isPercentEncodedByteAt,
  isSpecialScheme,
  isSpecialSchemeExceptFile,
  isURLCodePoint,
  isWindowsDriveLetterCodePoints,
  isWindowsDriveLetterString,
  p
};
