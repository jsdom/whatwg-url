"use strict";

const {
  domainParser,
  failure,
  forbiddenHostCodePoints,
  isPercentEncodedByteAt,
  isSpecialSchemeExceptFile,
  isURLCodePoint,
  isWindowsDriveLetterString,
  p
} = require("./url-miscellaneous");
const { hasAnOpaquePath } = require("./url-state-machine");

const pathSegmentExcludedCodePoints = new Set([p("/"), p("?")]);
const opaquePathExcludedCodePoints = new Set([p("?")]);

function splitOffFragment(input) {
  const fragmentStart = input.indexOf("#");

  if (fragmentStart === -1) {
    return { beforeFragment: input, fragment: null };
  }

  return {
    beforeFragment: input.substring(0, fragmentStart),
    fragment: input.substring(fragmentStart + 1)
  };
}

function splitOffQuery(input) {
  const queryStart = input.indexOf("?");

  if (queryStart === -1) {
    return { beforeQuery: input, query: null };
  }

  return {
    beforeQuery: input.substring(0, queryStart),
    query: input.substring(queryStart + 1)
  };
}

function isValidURLString(input, options = {}) {
  const baseURL = options.baseURL ?? null;

  return isValidAbsoluteURLWithFragmentString(input) ||
    (baseURL !== null && isValidRelativeURLWithFragmentString(input, baseURL));
}

function isValidAbsoluteURLWithFragmentString(input) {
  const { beforeFragment, fragment } = splitOffFragment(input);

  return (fragment === null || isValidURLFragmentString(fragment)) && isValidAbsoluteURLString(beforeFragment);
}

function isValidAbsoluteURLString(input) {
  const { beforeQuery, query } = splitOffQuery(input);

  if (query !== null && !isValidURLQueryString(query)) {
    return false;
  }

  const schemeMatch = /^([A-Za-z][A-Za-z0-9+.-]*):/u.exec(beforeQuery);
  if (schemeMatch === null) {
    return false;
  }

  const scheme = schemeMatch[1].toLowerCase();
  const afterScheme = beforeQuery.substring(schemeMatch[0].length);

  if (isSpecialSchemeExceptFile(scheme)) {
    return isValidSchemeRelativeSpecialURLString(afterScheme);
  }
  if (scheme === "file") {
    return isValidSchemeRelativeFileURLString(afterScheme);
  }

  return isValidSchemeRelativeURLString(afterScheme) ||
    isValidPathAbsoluteURLString(afterScheme) ||
    isValidOpaquePathURLString(afterScheme);
}

function isValidRelativeURLWithFragmentString(input, baseURL) {
  const { beforeFragment, fragment } = splitOffFragment(input);

  if (fragment !== null && !isValidURLFragmentString(fragment)) {
    return false;
  }

  if (hasAnOpaquePath(baseURL)) {
    return beforeFragment === "";
  }

  return isValidRelativeURLString(beforeFragment, baseURL);
}

function isValidRelativeURLString(input, baseURL) {
  return isValidRelativeURLStringForScheme(input, baseURL.scheme, baseURL.host);
}

function isValidRelativeURLStringForScheme(input, scheme, baseHost = null) {
  const { beforeQuery, query } = splitOffQuery(input);

  if (query !== null && !isValidURLQueryString(query)) {
    return false;
  }

  if (isSpecialSchemeExceptFile(scheme)) {
    return isValidSchemeRelativeSpecialURLString(beforeQuery) ||
      isValidPathAbsoluteURLString(beforeQuery) ||
      isValidPathRelativeSchemeLessURLString(beforeQuery);
  }

  if (scheme.toLowerCase() === "file") {
    return isValidSchemeRelativeFileURLString(beforeQuery) ||
      (baseHost === "" && isValidPathAbsoluteURLString(beforeQuery)) ||
      (baseHost !== "" && isValidPathAbsoluteNonWindowsFileURLString(beforeQuery)) ||
      isValidPathRelativeSchemeLessURLString(beforeQuery);
  }

  return isValidSchemeRelativeURLString(beforeQuery) ||
    isValidPathAbsoluteURLString(beforeQuery) ||
    isValidPathRelativeSchemeLessURLString(beforeQuery);
}

function isValidSchemeRelativeSpecialURLString(input) {
  if (!input.startsWith("//")) {
    return false;
  }

  const { authority, path } = splitOffPath(input.substring(2));

  return isValidHostAndPortString(authority, isValidHostString) &&
    (path === null || isValidPathAbsoluteURLString(path));
}

function isValidSchemeRelativeURLString(input) {
  if (!input.startsWith("//")) {
    return false;
  }

  const { authority, path } = splitOffPath(input.substring(2));

  return isValidOpaqueHostAndPortString(authority) &&
    (path === null || isValidPathAbsoluteURLString(path));
}

function isValidSchemeRelativeFileURLString(input) {
  if (!input.startsWith("//")) {
    return false;
  }

  const afterSlashes = input.substring(2);

  return afterSlashes === "" ||
    isValidHostAndPathAbsoluteNonWindowsFileURLString(afterSlashes) ||
    isValidPathAbsoluteURLString(afterSlashes);
}

function isValidHostAndPathAbsoluteNonWindowsFileURLString(input) {
  const { authority, path } = splitOffPath(input);

  return isValidHostString(authority) &&
    (path === null || isValidPathAbsoluteNonWindowsFileURLString(path));
}

function splitOffPath(input) {
  const pathStart = input.indexOf("/");

  if (pathStart === -1) {
    return { authority: input, path: null };
  }

  return {
    authority: input.substring(0, pathStart),
    path: input.substring(pathStart)
  };
}

function isValidHostAndPortString(input, isValidHost) {
  const parsed = splitHostAndPort(input);

  return parsed !== null &&
    parsed.host !== "" &&
    isValidHost(parsed.host) &&
    (parsed.port === null || isValidURLPortString(parsed.port));
}

function isValidOpaqueHostAndPortString(input) {
  if (input === "") {
    return true;
  }

  const parsed = splitHostAndPort(input);

  return parsed !== null &&
    parsed.host !== "" &&
    isValidOpaqueHostString(parsed.host) &&
    (parsed.port === null || isValidURLPortString(parsed.port));
}

function splitHostAndPort(input) {
  if (input.startsWith("[")) {
    const hostEnd = input.indexOf("]");
    if (hostEnd === -1) {
      return null;
    }

    const rest = input.substring(hostEnd + 1);
    if (rest !== "" && !rest.startsWith(":")) {
      return null;
    }

    return {
      host: input.substring(0, hostEnd + 1),
      port: rest === "" ? null : rest.substring(1)
    };
  }

  const portStart = input.indexOf(":");
  if (portStart === -1) {
    return { host: input, port: null };
  }

  return {
    host: input.substring(0, portStart),
    port: input.substring(portStart + 1)
  };
}

function isValidHostString(input) {
  return isValidDomainString(input) ||
    isValidIPv4AddressString(input) ||
    isValidBracketedIPv6AddressString(input);
}

function isValidDomainString(input) {
  return domainParser(input, null, true) !== failure;
}

// `isValidIPv4AddressString` and `isValidIPv6AddressString` are transcriptions of the IP-address
// ABNF in RFC 3986 section 3.2.2 into regular expressions. The URL Standard defines a
// "valid IPv6-address string" only by reference to the prose in RFC 4291 section 2.2, which has no
// grammar and is ambiguous about leading zeros and hex letter case
// (see https://github.com/whatwg/url/issues/916); RFC 3986 is the formal grammar that resolves it:
//
//   IPv6address =                            6( h16 ":" ) ls32
//               /                       "::" 5( h16 ":" ) ls32
//               / [               h16 ] "::" 4( h16 ":" ) ls32
//               / [ *1( h16 ":" ) h16 ] "::" 3( h16 ":" ) ls32
//               / [ *2( h16 ":" ) h16 ] "::" 2( h16 ":" ) ls32
//               / [ *3( h16 ":" ) h16 ] "::"    h16 ":"   ls32
//               / [ *4( h16 ":" ) h16 ] "::"              ls32
//               / [ *5( h16 ":" ) h16 ] "::"              h16
//               / [ *6( h16 ":" ) h16 ] "::"
//   ls32        = ( h16 ":" h16 ) / IPv4address
//   h16         = 1*4HEXDIG
//   IPv4address = dec-octet "." dec-octet "." dec-octet "." dec-octet
//   dec-octet   = DIGIT / %x31-39 DIGIT / "1" 2DIGIT / "2" %x30-34 DIGIT / "25" %x30-35
//
// So an `h16` field is one to four hex digits of either case with leading zeros allowed, while a
// `dec-octet` is a shortest 0-255 decimal with leading zeros forbidden. `IPv4address` on its own is
// exactly a "valid IPv4-address string", and `IPv6address` accepts the same language as the URL
// Standard's own IPv6 parser.
const h16 = "[0-9A-Fa-f]{1,4}";
const decOctet = "(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])";
const ipv4Address = `${decOctet}(?:\\.${decOctet}){3}`;
const ls32 = `(?:${h16}:${h16}|${ipv4Address})`;
const ipv6Alternatives = [
  `(?:${h16}:){6}${ls32}`,
  `::(?:${h16}:){5}${ls32}`,
  `(?:${h16})?::(?:${h16}:){4}${ls32}`,
  `(?:(?:${h16}:){0,1}${h16})?::(?:${h16}:){3}${ls32}`,
  `(?:(?:${h16}:){0,2}${h16})?::(?:${h16}:){2}${ls32}`,
  `(?:(?:${h16}:){0,3}${h16})?::(?:${h16}:){1}${ls32}`,
  `(?:(?:${h16}:){0,4}${h16})?::${ls32}`,
  `(?:(?:${h16}:){0,5}${h16})?::${h16}`,
  `(?:(?:${h16}:){0,6}${h16})?::`
];
const ipv4AddressRegExp = new RegExp(`^${ipv4Address}$`, "u");
const ipv6AddressRegExp = new RegExp(`^(?:${ipv6Alternatives.join("|")})$`, "u");

function isValidIPv4AddressString(input) {
  return ipv4AddressRegExp.test(input);
}

function isValidBracketedIPv6AddressString(input) {
  return input.startsWith("[") &&
    input.endsWith("]") &&
    isValidIPv6AddressString(input.substring(1, input.length - 1));
}

function isValidIPv6AddressString(input) {
  return ipv6AddressRegExp.test(input);
}

function isValidOpaqueHostString(input) {
  return isValidBracketedIPv6AddressString(input) ||
    (input !== "" && isValidURLUnits(input, forbiddenHostCodePoints));
}

function isValidURLPortString(input) {
  if (input === "") {
    return true;
  }
  if (!/^[0-9]+$/u.test(input)) {
    return false;
  }

  return Number(input) <= 65535;
}

function isValidPathAbsoluteURLString(input) {
  return input.startsWith("/") && input.substring(1).split("/").every(isValidURLPathSegmentString);
}

function isValidPathAbsoluteNonWindowsFileURLString(input) {
  return isValidPathAbsoluteURLString(input) &&
    !(input.length >= 4 && input[0] === "/" && isWindowsDriveLetterString(input.substring(1, 3)) &&
      input[3] === "/");
}

function isValidPathRelativeURLString(input) {
  return !input.startsWith("/") && input.split("/").every(isValidURLPathSegmentString);
}

function isValidURLPathSegmentString(input) {
  return isValidURLUnits(input, pathSegmentExcludedCodePoints);
}

function isValidPathRelativeSchemeLessURLString(input) {
  return isValidPathRelativeURLString(input) && !/^[A-Za-z][A-Za-z0-9+.-]*:/u.test(input);
}

function isValidOpaquePathURLString(input) {
  return (input === "" || input[0] !== "/") && isValidURLUnits(input, opaquePathExcludedCodePoints);
}

function isValidURLQueryString(input) {
  return isValidURLUnits(input);
}

function isValidURLFragmentString(input) {
  return isValidURLUnits(input);
}

function isValidURLUnits(input, excludedCodePoints = new Set()) {
  for (let i = 0; i < input.length;) {
    if (input[i] === "%") {
      if (!isPercentEncodedByteAt(input, i)) {
        return false;
      }

      i += 3;
      continue;
    }

    const codePoint = input.codePointAt(i);
    if (!isURLCodePoint(codePoint) || excludedCodePoints.has(codePoint)) {
      return false;
    }

    i += codePoint > 0xFFFF ? 2 : 1;
  }

  return true;
}

module.exports = {
  isValidURLString
};
