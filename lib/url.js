"use strict";
const punycode = require("punycode");

/*jshint unused: false */

const relativeSchemas = {
  "ftp": "21",
  "file": null,
  "gopher": "70",
  "http": "80",
  "https": "443",
  "ws": "80",
  "wss": "443"
};

const localSchemas = [
  "about",
  "blob",
  "data",
  "filesystem"
];

const bufferReplacement = {
  "%2e": ".",
  ".%2e": "..",
  "%2e.": "..",
  "%2e%2e": ".."
};

const STATES = {
  SCHEME_START: 1,
  SCHEME: 2,
  NO_SCHEME: 3,
  RELATIVE: 4,
  RELATIVE_OR_AUTHORITY: 5,
  AUTHORITY_FIRST_SLASH: 6,
  SCHEME_DATA: 7,
  QUERY: 8,
  FRAGMENT: 9,
  AUTHORITY_IGNORE_SLASHES: 10,
  RELATIVE_SLASH: 11,
  RELATIVE_PATH: 12,
  FILE_HOST: 13,
  AUTHORITY: 14,
  HOST: 15,
  RELATIVE_PATH_START: 16,
  HOST_NAME: 17,
  PORT: 18
};

function countSymbols(str) {
  return punycode.ucs2.decode(str).length;
}

function at(input, idx) {
  const c = input.codePointAt(idx);
  return isNaN(c) ? undefined : String.fromCodePoint(c);
}

function isASCIIDigit(c) {
  return c >= 0x30 && c <= 0x39;
}

function isASCIIAlpha(c) {
  return (c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A);
}

function isASCIIHex(c) {
  return (c >= 0x41 && c <= 0x46) || (c >= 0x61 && c <= 0x66);
}

function simpleEncode(c) {
  if (c < 0x20 || c > 0x7E) {
    return encodeURIComponent(String.fromCodePoint(c));
  } else {
    return String.fromCodePoint(c);
  }
}

function defaultEncode(c) {
  const c_str = String.fromCodePoint(c);
  if (c <= 0x20 || c >= 0x7E || c_str === "\"" || c_str === "#" ||
      c_str === "<" || c_str === ">" || c_str === "?" || c_str === "`") {
    return encodeURIComponent(c_str);
  } else {
    return c_str;
  }
}

//TODO: Finish up
function parseIPv6(input) {
  return "[" + input + "]";
}

function parseHost(input, isUnicode) {
  if (input === "") {
    throw new TypeError("Invalid Host");
  }

  if (input[0] === "[") {
    if (input[input.length - 1] !== "]") {
      throw new TypeError("Invalid Host");
    }

    return parseIPv6(input.substr(1, input.length - 2));
  }

  let domain = decodeURIComponent(input);
  let asciiDomain = punycode.toASCII(domain);
  if (domain.search(/\u0000|\u0009|\u000A|\u000D|\u0020|#|%|\/|:|\?|@|\[|\\|\]/) !== -1) {
    throw new TypeError("Invalid Host");
  }

  return isUnicode ? punycode.toUnicode(asciiDomain) : asciiDomain;
}

//TODO: Finish up
function serializeHost(host) {
  if (host === null) {
    return "";
  }

  return host;
}

function URLStateMachine(input, base, encoding_override, url, state_override) {
  this.pointer = 0;
  this.input = input;
  this.base = base || null;
  this.encoding_override = encoding_override || "utf-8";
  this.state_override = state_override;
  this.url = url;

  if (!this.url) {
    this.url = {
      scheme: "",
      scheme_data: "",
      username: "",
      password: null,
      host: null,
      port: "",
      path: [],
      query: null,
      fragment: null,

      isRelative: false
    };

    this.input = this.input.trim();
  }

  this.state = state_override || STATES.SCHEME_START;

  this.buffer = "";
  this.at_flag = false;
  this.arr_flag = false;
  this.parse_error = false;

  const len = countSymbols(this.input);
  for (; this.pointer <= len; ++this.pointer) {
    const c = this.input.codePointAt(this.pointer);
    const c_str = isNaN(c) ? undefined : String.fromCodePoint(c);

    // exec state machine
    if (this["parse" + this.state](c, c_str) === false) {
      break; // terminate algorithm
    }
  }
}

URLStateMachine.prototype["parse" + STATES.SCHEME_START] = function parseSchemeStart(c, c_str) {
  if (isASCIIAlpha(c)) {
    this.buffer += c_str.toLowerCase();
    this.state = STATES.SCHEME;
  } else if (!this.state_override) {
    this.state = STATES.NO_SCHEME;
    --this.pointer;
  } else {
    this.parse_error = true;
    return false;
  }
};

URLStateMachine.prototype["parse" + STATES.SCHEME] = function parseScheme(c, c_str) {
  if (isASCIIAlpha(c) || c_str === "+" || c_str === "-" || c_str === ".") {
    this.buffer += c_str.toLowerCase();
  } else if (c_str === ":") {
    this.url.scheme = this.buffer;
    this.buffer = "";
    if (this.state_override) {
      return false;
    }
    if (relativeSchemas[this.url.scheme] !== undefined) {
      this.url.isRelative = true;
    }
    if (this.url.scheme === "file") {
      this.state = STATES.RELATIVE;
    } else if (this.url.isRelative && this.base !== null && this.base.scheme === this.url.scheme) {
      this.state = STATES.RELATIVE_OR_AUTHORITY;
    } else if (this.url.isRelative) {
      this.state = STATES.AUTHORITY_FIRST_SLASH;
    } else {
      this.state = STATES.SCHEME_DATA;
    }
  } else if (!this.state_override) {
    this.buffer = "";
    this.state = STATES.NO_SCHEME;
    this.pointer = -1;
  } else if (isNaN(c)) {
    return false;
  } else {
    this.parse_error = true;
    return false;
  }
};

URLStateMachine.prototype["parse" + STATES.NO_SCHEME] = function parseScheme(c, c_str) {
  //jshint unused:false
  if (this.base === null || relativeSchemas[this.base.scheme] === undefined) {
    throw new TypeError("Invalid URL");
  } else {
    this.state = STATES.RELATIVE;
    --this.pointer;
  }
};

URLStateMachine.prototype["parse" + STATES.RELATIVE] = function parseScheme(c, c_str) {
  this.url.isRelative = true;
  if (this.url.scheme !== "file") {
    this.url.scheme = this.base.scheme;
  }
  if (isNaN(c)) {
    this.url.host = this.base.host;
    this.url.port = this.base.port;
    this.url.path = this.base.path.slice();
    this.url.query = this.base.query;
  } else if (c_str === "\\" || c_str === "/") {
    if (c_str === "\\") {
      this.parse_error = true;
    }
    this.state = STATES.RELATIVE_SLASH;
  } else if (c_str === "?") {
    this.url.host = this.base.host;
    this.url.port = this.base.port;
    this.url.path = this.base.path.slice();
    this.url.query = "";
    this.state = STATES.QUERY;
  } else if (c_str === "#") {
    this.url.host = this.base.host;
    this.url.port = this.base.port;
    this.url.path = this.base.path.slice();
    this.url.query = this.base.query;
    this.url.fragment = "";
    this.state = STATES.FRAGMENT;
  } else {
    let nextChar = at(this.input, this.pointer + 1);
    let nextNextChar = at(this.input, this.pointer + 2);
    if (this.url.scheme !== "file" || !isASCIIAlpha(c) || !(nextChar === ":" || nextChar === "|") ||
				countSymbols(this.input) - this.pointer === 1 || !(nextNextChar === "/" || nextNextChar === "\\" ||
        nextNextChar === "?" || nextNextChar === "#")) {
      this.url.host = this.base.host;
      this.url.port = this.base.port;
      this.url.path = this.base.path.slice(0, this.base.path.length - 1);
    }

    this.state = STATES.RELATIVE_PATH;
    --this.pointer;
  }
};

URLStateMachine.prototype["parse" + STATES.RELATIVE_OR_AUTHORITY] = function parseScheme(c, c_str) {
  if (c_str === "/" && at(this.input, this.pointer + 1) === "/") {
    this.state = STATES.AUTHORITY_IGNORE_SLASHES;
    ++this.pointer;
  } else {
    this.parse_error = true;
    this.state = STATES.RELATIVE;
    --this.pointer;
  }
};

URLStateMachine.prototype["parse" + STATES.AUTHORITY_FIRST_SLASH] = function parseScheme(c, c_str) {
  if (c_str === "/" && at(this.input, this.pointer + 1) === "/") { // patching AUTHORITY_SECOND_SLASH out here
    ++this.pointer;
    this.state = STATES.AUTHORITY_IGNORE_SLASHES;
  } else {
    this.parse_error = true;
    this.state = STATES.AUTHORITY_IGNORE_SLASHES;
    --this.pointer;
  }
};

URLStateMachine.prototype["parse" + STATES.SCHEME_DATA] = function parseScheme(c, c_str) {
  if (c_str === "?") {
    this.url.query = "";
    this.state = STATES.QUERY;
  } else if (c_str === "#") {
    this.url.fragment = "";
    this.state = STATES.FRAGMENT;
  } else {
    //TODO: If c is not the EOF code point, not a URL code point, and not "%", parse error.
    if (c_str === "%" &&
        (!isASCIIHex(this.input.codePointAt(this.pointer + 1)) ||
         !isASCIIHex(this.input.codePointAt(this.pointer + 2)))) {
      this.parse_error = true;
    } else if (c !== undefined && c !== 0x9 && c !== 0xA && c !== 0xD) {
      this.url.scheme_data += simpleEncode(c);
    }
  }
};

URLStateMachine.prototype["parse" + STATES.QUERY] = function parseScheme(c, c_str) {
  if (isNaN(c) || (!this.state_override && c_str === "#")) {
    if (!this.url.isRelative || this.url.scheme === "ws" || this.url.scheme === "wss") {
      this.encoding_override = "utf-8";
    }
    this.buffer = this.buffer; //TODO: Use encoding override instead
    this.url.query += encodeURI(this.buffer);
    this.buffer = "";
    if (c_str === "#") {
      this.url.fragment = "";
      this.state = STATES.FRAGMENT;
    }
  } else if (c === 0x9 || c === 0xA || c === 0xD) {
    this.parse_error = true;
  } else {
    //TODO: If c is not a URL code point and not "%", parse error.
    if (c_str === "%" &&
        (!isASCIIHex(this.input.codePointAt(this.pointer + 1)) ||
         !isASCIIHex(this.input.codePointAt(this.pointer + 2)))) {
      this.parse_error = true;
    } else {
      this.buffer += c_str;
    }
  }
};

URLStateMachine.prototype["parse" + STATES.FRAGMENT] = function parseScheme(c, c_str) {
  if (isNaN(c)) { // do nothing
  } else if (c === 0x0 || c === 0x9 || c === 0xA || c === 0xD) {
    this.parse_error = true;
  } else {
    //TODO: If c is not a URL code point and not "%", parse error.
    if (c_str === "%" &&
        (!isASCIIHex(this.input.codePointAt(this.pointer + 1)) ||
         !isASCIIHex(this.input.codePointAt(this.pointer + 2)))) {
      this.parse_error = true;
    } else {
      this.url.fragment += c_str;
    }
  }
};

URLStateMachine.prototype["parse" + STATES.AUTHORITY_IGNORE_SLASHES] = function parseScheme(c, c_str) {
  if (c_str !== "/" && c_str !== "\\") {
    this.state = STATES.AUTHORITY;
    --this.pointer;
  } else {
    this.parse_error = true;
  }
};

URLStateMachine.prototype["parse" + STATES.RELATIVE_SLASH] = function parseScheme(c, c_str) {
  if (c_str === "/" || c_str === "\\") {
    if (c_str === "\\") {
      this.parse_error = true;
    }
    if (this.url.scheme === "file") {
      this.state = STATES.FILE_HOST;
    } else {
      this.state = STATES.AUTHORITY_IGNORE_SLASHES;
    }
  } else {
    if (this.url.scheme !== "file") {
      this.url.host = this.base.host;
      this.url.port = this.base.port;
    }
    this.state = STATES.RELATIVE_PATH;
    --this.pointer;
  }
};

URLStateMachine.prototype["parse" + STATES.RELATIVE_PATH] = function parseScheme(c, c_str) {
  if (isNaN(c) || c_str === "/" || c_str === "\\" || (!this.state_override && (c_str === "?" || c_str === "#"))) {
    if (c_str === "\\") {
      this.parse_error = true;
    }

    this.buffer = bufferReplacement[this.buffer.toLowerCase()] || this.buffer;
    if (this.buffer === "..") {
      this.url.path.pop();
      if (c_str !== "/" && c_str !== "\\") {
        this.url.path.push("");
      }
    } else if (this.buffer === "." && (c_str !== "/" || c_str !== "\\")) {
      this.url.path.push("");
    } else if (this.buffer !== ".") {
      if (this.url.scheme === "file" && this.url.path.length === 0 &&
          this.buffer.length === 2 && isASCIIAlpha(this.buffer[0]) && this.buffer[1] === "|") {
        this.buffer = this.buffer[0] + ":";
      }
      this.url.path.push(this.buffer);
    }
    this.buffer = "";
    if (c_str === "?") {
      this.url.query = "";
      this.state = STATES.QUERY;
    }
    if (c_str === "#") {
      this.url.fragment = "";
      this.state = STATES.FRAGMENT;
    }
  } else if (c === 0x9 || c === 0xA || c === 0xD) {
    this.parse_error = true;
  } else {
    //TODO:If c is not a URL code point and not "%", parse error.
    if (c_str === "%" &&
        (!isASCIIHex(this.input.codePointAt(this.pointer + 1)) ||
         !isASCIIHex(this.input.codePointAt(this.pointer + 2)))) {
      this.parse_error = true;
    }

    this.buffer += defaultEncode(c);
  }
};

URLStateMachine.prototype["parse" + STATES.FILE_HOST] = function parseScheme(c, c_str) {
  if (isNaN(c) || c_str === "/" || c_str === "\\" || c_str === "?" || c_str === "#") {
    --this.pointer;
    // don't need to count symbols here since we check ASCII values
    if (this.buffer.length === 2 &&
        isASCIIAlpha(this.buffer[0]) && (this.buffer[1] === ":" || this.buffer[1] === "|")) {
      this.state = STATES.RELATIVE_PATH;
    } else if (this.buffer === "") {
      this.state = STATES.RELATIVE_PATH_START;
    } else {
      let host = parseHost(this.buffer);
      this.url.host = host;
      this.buffer = "";
      this.state = STATES.RELATIVE_PATH_START;
    }
  } else if (c === 0x9 || c === 0xA || c === 0xD) {
    this.parse_error = true;
  } else {
    this.buffer += c_str;
  }
};

URLStateMachine.prototype["parse" + STATES.AUTHORITY] = function parseScheme(c, c_str) {
  if (c_str === "@") {
    if (this.at_flag) {
      this.parse_error = true;
      this.buffer = "%40" + this.buffer;
    }
    this.at_flag = true;

    // careful, this is based on buffer and has its own pointer (this.pointer != pointer) and inner chars
    const len = countSymbols(this.buffer);
    for (let pointer = 0; pointer < len; ++pointer) {
      /* jshint -W004 */
      const c = this.buffer.codePointAt(pointer);
      const c_str = String.fromCodePoint(c);
      /* jshint +W004 */

      if (c === 0x9 || c === 0xA || c === 0xD) {
        this.parse_error = true;
        continue;
      }
      //TODO: If code point is not a URL code point and not "%", parse error.
      if (c_str === "%" &&
          (!isASCIIHex(this.buffer.codePointAt(pointer + 1)) ||
           !isASCIIHex(this.buffer.codePointAt(pointer + 2)))) {
        this.parse_error = true;
      }
      if (c_str === ":" && this.url.password === null) {
        this.url.password = "";
        continue;
      }
      if (this.url.password !== null) {
        this.url.password += simpleEncode(c);
      } else {
        this.url.username += simpleEncode(c);
      }
    }
    this.buffer = "";
  } else if (isNaN(c) || c_str === "/" || c_str === "\\" || c_str === "?" || c_str === "#") {
    this.pointer -= countSymbols(this.buffer) + 1;
    this.buffer = "";
    this.state = STATES.HOST;
  } else {
    this.buffer += c_str;
  }
};

URLStateMachine.prototype["parse" + STATES.HOST_NAME] =
URLStateMachine.prototype["parse" + STATES.HOST] = function parseScheme(c, c_str) {
  if (c_str === ":" && !this.arr_flag) {
    let host = parseHost(this.buffer);
    this.url.host = host;
    this.buffer = "";
    this.state = STATES.PORT;
    if (this.state_override === STATES.HOST_NAME) {
      return false;
    }
  } else if (isNaN(c) || c_str === "/" || c_str === "\\" || c_str === "?" || c_str === "#") {
    --this.pointer;
    let host = parseHost(this.buffer);
    this.url.host = host;
    this.buffer = "";
    this.state = STATES.RELATIVE_PATH_START;
    if (this.state_override) {
      return false;
    }
  } else if (c === 0x9 || c === 0xA || c === 0xD) {
    this.parse_error = true;
  } else {
    if (c_str === "[") {
      this.arr_flag = true;
    } else if (c_str === "]") {
      this.arr_flag = false;
    }
    this.buffer += c_str;
  }
};

URLStateMachine.prototype["parse" + STATES.RELATIVE_PATH_START] = function parseScheme(c, c_str) {
  if (c_str === "\\") {
    this.parse_error = true;
  }
  this.state = STATES.RELATIVE_PATH;
  if (c_str !== "\\" && c_str !== "/") {
    --this.pointer;
  }
};

URLStateMachine.prototype["parse" + STATES.PORT] = function parseScheme(c, c_str) {
  if (isASCIIDigit(c)) {
    this.buffer += c_str;
  } else if (isNaN(c) || c_str === "/" || c_str === "\\" || c_str === "?" || c_str === "#") {
    while (this.buffer[0] === "0" && this.buffer.length > 1) {
      this.buffer = this.buffer.substr(1);
    }
    if (this.buffer === relativeSchemas[this.url.scheme]) {
      this.buffer = "";
    }
    this.url.port = this.buffer;
    if (this.state_override) {
      return false;
    }
    this.buffer = "";
    this.state = STATES.RELATIVE_PATH_START;
    --this.pointer;
  } else if (c === 0x9 || c === 0xA || c === 0xD) {
    this.parse_error = true;
  } else {
    this.parse_error = true;
    throw new TypeError("Invalid URL");
  }
};

function serializeURL(url, excludeFragment) {
  let output = url.scheme + ":";
  if (url.isRelative) {
    output += "//" + url.username;
    if (url.password !== null) {
      output += ":" + url.password;
    }
    if (url.username !== "" || url.password !== null) {
      output += "@";
    }
    output += serializeHost(url.host);
    if (url.port !== "") {
      output += ":" + url.port;
    }
    output += "/" + url.path.join("/");
  } else {
    output += url.scheme_data;
  }

  if (url.query !== null) {
    output += "?" + url.query;
  }

  if (!excludeFragment && url.fragment !== null) {
    output += "#" + url.fragment;
  }

  return output;
}

function URL(url, base) {
  if (this === undefined) {
    throw new TypeError("Failed to construct 'URL': Please use the 'new' operator, " +
				"this DOM object constructor cannot be called as a function.");
  }

  let parsedBase = null;
  if (base) {
    parsedBase = new URLStateMachine(base);
  }

  let parsedURL = new URLStateMachine(url, parsedBase.url);
  var input = "";

  Object.defineProperty(this, "href", {
    get: function () {
      if (parsedURL.url === null) {
        return input;
      }

      return serializeURL(parsedURL.url);
    }
  });
}

module.exports.URL = URL;
