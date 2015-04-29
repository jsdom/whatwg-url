"use strict";

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
}

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
	return String.fromCodePoint(input.codePointAt(idx));
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
		return String.fromCodePoint(c);
	} else {
		return escape(String.fromCodePoint(c));
	}
}

//TODO: Finish up
function parseHost(input, isUnicode) {
	if (input === "") {
		throw new TypeError("Invalid Host");
	}
	
	if (input[0] === "[") {
		if (input[input.length - 1] !== "]") {
			throw new TypeError("Invalid Host");
		}
	}
	
	return input;
}

function InternalURL() {
	
}

function parseUrl(input, base, encoding_override, url, state_override) {
	if (!url) {
		url = {
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

		input = input.trim();
	}
	
	if (!base) base = null;
	if (!encoding_override) encoding_override = "utf-8";
	
	let state = state_override || STATES.SCHEME_START;
	
	let buffer = "";
	let at_flag = false;
	let arr_flag = false;
	let parse_error = false;
	
	loop:
		for (let pointer = 0, len = countSymbols(input); pointer <= len; ++pointer) {
			const c = input.codePointAt(pointer);
			const c_str = isNaN(c) ? undefined : String.fromCodePoint(c);
			
			switch (state) {
				case STATES.SCHEME_START:
					if (isASCIIAlpha(c)) {
						buffer += c_str.toLowerCase();
						state = STATES.SCHEME;
					} else if (!state_override) {
						state = STATES.NO_SCHEME;
						--pointer;
					} else {
						parse_error = true;
						break loop;
					}
					break;
				case STATES.SCHEME:
					if (isASCIIAlpha(c) || c_str === "+" || c_str === "-" || c_str === ".") {
						buffer += c_str.toLowerCase();
					} else if (c_str === ":") {
						url.scheme = buffer;
						buffer = "";
						if (state_override) {
							return;
						}
						if (relativeSchemas[url.scheme] !== undefined) {
							url.isRelative = true;
						}
						if (url.scheme === "file") {
							state = STATES.RELATIVE;
						}
						if (url.isRelative && base !== null && base.scheme === url.scheme) {
							state = STATES.RELATIVE_OR_AUTHORITY;
						} else if (url.isRelative) {
							state = STATES.AUTHORITY_FIRST_SLASH;
						} else {
							state = STATES.SCHEME_DATA;
						}
					} else if (!state_override) {
						buffer = "";
						state = STATES.NO_SCHEME;
						pointer = -1;
					} else if (isNaN(c)) {
						break loop;
					} else {
						parse_error = true;
						break loop;
					}
					break;
				case STATES.SCHEME_DATA:
					if (c_str === "?") {
						url.query = "";
						state = STATES.QUERY;
					} else if (c_str === "#") {
						state = STATES.FRAGMENT;
					} else {
						//TODO: If c is not the EOF code point, not a URL code point, and not "%", parse error.
						if (c_str === "%" && (!isASCIIHex(input.codePointAt(pointer + 1)) || !isASCIIHex(input.codePointAt(pointer + 2)))) {
							parse_error = true;
						} else if (c !== undefined && c !== 0x9 && c !== 0xA && c !== 0xD) {
							url.scheme_data += simpleEncode(c);
						}
					}
					break;
				case STATES.NO_SCHEME:
					if (base === null || relativeSchemas[base.scheme] === undefined) {
						throw new TypeError("Invalid URL");
					} else {
						state = STATES.RELATIVE;
						--pointer;
					}
					break;
				case STATES.RELATIVE_OR_AUTHORITY:
					if (c_str === "/" && at(input, pointer + 1) === "/") {
						state = STATES.AUTHORITY_IGNORE_SLASHES;
						++pointer;
					} else {
						parse_error = true;
						state = STATES.RELATIVE;
						--pointer;
					}
					break;
				case STATES.RELATIVE:
					url.isRelative = true;
					if (url.scheme !== "file") {
						url.scheme = base.scheme;
					}
					if (isNaN(c)) {
						url.host = base.host;
						url.port = base.port;
						url.path = base.path.slice();
						url.query = base.query;
					}
					
					if (c_str === "\\" || c_str === "/") {
						if (c_str === "\\") {
							parse_error = true;
						}
						state = STATES.RELATIVE_SLASH;
					} else if (c_str === "?") {
						url.host = base.host;
						url.port = base.port;
						url.path = base.path.slice();
						url.query = "";
						state = STATES.QUERY;
					} else if (c_str === "#") {
						url.host = base.host;
						url.port = base.port;
						url.path = base.path.slice();
						url.query = base.query;
						url.fragment = "";
						state = STATES.FRAGMENT;
					} else {
						let nextChar = at(input, pointer + 1);
						let nextNextChar = at(input, pointer + 2);
						if (url.scheme !== "file" || !isASCIIAlpha(c) || !(nextChar === ":" || nextChar === "|") || 
								len - pointer === 1 || !(nextNextChar === "/" || nextNextChar === "\\" || nextNextChar === "?" || nextNextChar === "#")) {
							url.host = base.host;
							url.port = base.port;
							url.path = base.path.slice(0, base.path.length - 1);
						}
						
						state = STATES.RELATIVE_PATH;
						--pointer;
					}
					break;
				case STATES.RELATIVE_SLASH:
					if (c_str === "/" || c_str === "\\") {
						if (c_str === "\\") {
							parse_error = true;
						}
						if (url.scheme === "file") {
							state = STATES.FILE_HOST;
						} else {
							state = STATES.AUTHORITY_IGNORE_SLASHES;
						}
					} else {
						if (url.scheme !== "file") {
							url.host = base.host;
							url.port = base.port;
						}
						state = STATES.RELATIVE_PATH;
						--pointer;
					}
					break;
				case STATES.AUTHORITY_FIRST_SLASH:
					if (c_str === "/" && at(input, pointer + 1) === "/") { // patching AUTHORITY_SECOND_SLASH out here
						++pointer;
						state = STATES.AUTHORITY_IGNORE_SLASHES;
					} else {
						parse_error = true;
						state = STATES.AUTHORITY_IGNORE_SLASHES;
						--pointer;
					}
					break;
				case STATES.AUTHORITY_IGNORE_SLASHES:
					if (c_str !== "/" && c_str !== "\\") {
						state = STATES.AUTHORITY;
						--pointer;
					} else {
						parse_error = true;
					}
					break;
				case STATES.AUTHORITY:
					if (c_str === "@") {
						if (at_flag) {
							parse_error = true;
							buffer = "%40" + buffer;
						}
						at_flag = true;
						for (let pointer = 0, len = countSymbols(input); pointer <= len; ++pointer) {
							const c = input.codePointAt(pointer);
							const c_str = String.fromCodePoint(c);
							if (c === 0x9 || c === 0xA || c === 0xD) {
								parse_error = true;
								continue;
							}
							//TODO: If code point is not a URL code point and not "%", parse error.
							if (c_str === "%" && (!isASCIIHex(input.codePointAt(pointer + 1)) || !isASCIIHex(input.codePointAt(pointer + 2)))) {
								parse_error = true;
							}
							if (c_str === ":" && url.password === null) {
								url.password = "";
								continue;
							}
							if (url.password !== null) {
								url.password += simpleEncode(c);
							} else {
								url.username += simpleEncode(c);
							}
						}
						buffer = "";
					} else if (isNaN(c) || c_str === "/" || c_str === "\\" || c_str === "?" || c_str === "#") {
						pointer -= countSymbols(buffer) + 1;
						buffer = "";
						state = STATES.HOST;
					} else {
						buffer += c_str;
					}
					break;
				case STATES.FILE_HOST:
					if (isNaN(c) || c_str === "/" || c_str === "\\" || c_str === "?" || c_str === "#") {
						--pointer;
						// don't need to count symbols here since we check ASCII values
						if (buffer.length === 2 && isASCIIAlpha(buffer[0]) && (buffer[1] === ":" || buffer[1] === "|")) {
							state = STATES.RELATIVE_PATH;
						} else if (buffer === "") {
							state = STATES.RELATIVE_PATH_START;
						} else {
							let host = parseHost(buffer);
							url.host = host;
							buffer = "";
							state = STATES.RELATIVE_PATH_START;
						}
					} else if (c === 0x9 || c === 0xA || c === 0xD) {
						parse_error = true;
					} else {
						buffer += c_str;
					}
					break;
				case STATES.HOST:
				case STATES.HOST_NAME:
					if (c_str === ":" && !arr_flag) {
						let host = parseHost(buffer);
						url.host = host;
						buffer = "";
						state = STATES.PORT;
						if (state_override === STATES.HOST_NAME) {
							break loop;
						}
					} else if (isNaN(c) || c_str === "/" || c_str === "\\" || c_str === "?" || c_str === "#") {
						--pointer;
						let host = parseHost(buffer);
						url.host = host;
						buffer = "";
						state = STATES.RELATIVE_PATH_START;
						if (state_override) {
							break loop;
						}
					} else if (c === 0x9 || c === 0xA || c === 0xD) {
						parse_error = true;
					} else {
						if (c_str === "[") {
							arr_flag = true;
						} else if (c_str === "]") {
							arr_flag = false;
						}
						buffer += c_str;
					}
					break;
				case STATES.PORT:
					if (isASCIIDigit(c)) {
						buffer += c_str;
					} else if (isNaN(c) || c_str === "/" || c_str === "\\" || c_str === "?" || c_str === "#") {
						while (buffer[0] === "0" && buffer.length > 1) {
							buffer = buffer.substr(1);
						}
						if (buffer === relativeSchemas[url.scheme]) {
							buffer = "";
						}
						url.port = buffer;
						if (state_override) {
							break loop;
						}
						buffer = "";
						state = STATES.RELATIVE_PATH_START;
						--pointer;
					} else if (c === 0x9 || c === 0xA || c === 0xD) {
						parse_error = true;
					} else {
						parse_error = true;
						throw new TypeError("Invalid URL");
					}
					break;
				case STATES.RELATIVE_PATH_START:
					if (c_str === "\\") {
						parse_error = true;
					}
					state = STATES.RELATIVE_PATH;
					if (c_str !== "\\" && c_str !== "/") {
						--pointer;
					}
					break;
				case STATES.RELATIVE_PATH:
					if (isNaN(c) || c_str === "/" || c_str === "\\" || (!state_override && (c_str === "?" || c_str === "#"))) {
						if (c === "\\") {
							parse_error = true;
						}
						
						buffer = bufferReplacement[buffer.toLowerCase()] || buffer;
						if (buffer === "..") {
							url.path.splice(url.path.length - 1, 1);
							if (c_str !== "/" && c_str !== "\\") {
								url.path.push("");
							}
						} else if (buffer !== ".") {
							if (url.scheme === "file" && url.path.length === 0 && buffer.length === 2 && isASCIIAlpha(buffer[0]) && buffer[1] === "|") {
								buffer = buffer[0] + ":";
							}
							url.path.push(buffer);
						}
						buffer = "";
						if (c_str === "?") {
							url.query = "";
							state = STATES.QUERY;
						}
						if (c === "#") {
							url.fragment = "";
							state = STATES.FRAGMENT;
						}
					} else if (c === 0x9 || c === 0xA || c === 0xD) {
						parse_error = true;
					} else {
						//TODO:If c is not a URL code point and not "%", parse error.
						if (c_str === "%" && (!isASCIIHex(input.codePointAt(pointer + 1)) || !isASCIIHex(input.codePointAt(pointer + 2)))) {
							parse_error = true;
						} else if (c !== undefined && c !== 0x9 && c !== 0xA && c !== 0xD) {
							url.scheme_data += simpleEncode(c);
						}
					}
					break;
				case STATES.QUERY:
					if (isNaN(c) || (!state_override && c_str === "#")) {
						if (!url.isRelative || url.scheme === "ws" || url.scheme === "wss") {
							encoding_override = "utf-8";
						}
						buffer = buffer; //TODO: Use encoding override instead
						url.query += encodeURIComponent(buffer);
						buffer = "";
						if (c_str === "#") {
							url.fragment = "";
							state = STATES.FRAGMENT;
						}
					} else if (c === 0x9 || c === 0xA || c === 0xD) {
						parse_error = true;
					} else {
						//TODO: If c is not a URL code point and not "%", parse error.
						if (c_str === "%" && (!isASCIIHex(input.codePointAt(pointer + 1)) || !isASCIIHex(input.codePointAt(pointer + 2)))) {
							parse_error = true;
						} else {
							buffer += c_str;
						}
					}
					break;
				case STATES.FRAGMENT:
					if (isNaN(c)) { // do nothing
					} else if (c === 0x0 || c === 0x9 || c === 0xA || c === 0xD) {
						parse_error = true;
					} else {
						//TODO: If c is not a URL code point and not "%", parse error.
						if (c_str === "%" && (!isASCIIHex(input.codePointAt(pointer + 1)) || !isASCIIHex(input.codePointAt(pointer + 2)))) {
							parse_error = true;
						} else {
							buffer += c_str;
						}
					}
					break;
			}
		}
	
	return url;
};

function URL(url, base) {
	if (this === undefined) {
		throw new TypeError("Failed to construct 'URL': Please use the 'new' operator, " +
				"this DOM object constructor cannot be called as a function.");
	}
	
	let parsedBase = null;
	if (base) {
		parsedBase = parseUrl(base);
	}
	
	this.parsedURL = parseUrl(url, parsedBase);
}

module.exports.URL = URL;
