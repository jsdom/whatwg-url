// These tests we can download and run directly in `test/web-platform.js`.
export const directlyRunnableTests = [
  "url-searchparams.any.js",
  "url-setters-stripping.any.js",
  "url-statics-canparse.any.js",
  "url-statics-parse.any.js",
  "url-tojson.any.js",
  "urlencoded-parser.any.js",
  "urlsearchparams-append.any.js",
  "urlsearchparams-constructor.any.js",
  "urlsearchparams-delete.any.js",
  "urlsearchparams-foreach.any.js",
  "urlsearchparams-getall.any.js",
  "urlsearchparams-get.any.js",
  "urlsearchparams-has.any.js",
  "urlsearchparams-set.any.js",
  "urlsearchparams-size.any.js",
  "urlsearchparams-sort.any.js",
  "urlsearchparams-stringifier.any.js",
];

// These tests need some special handling in `test/web-platform.js`, since they need to be hooked up to their resource
// files in a case-by-case way. We still download them, but they're in a separately-exported array so that the runner
// can distinguish.
export const resourceDependentTests = [
  "IdnaTestV2.any.js",
  "IdnaTestV2-removed.any.js",
  "url-constructor.any.js",
  "url-origin.any.js",
  "url-setters.any.js",
];

// These tests need their logic duplicated in `test/web-platform.js`, because we can't easily shim them. They are not
// downloaded, but we list them here so that it's easy to understand our categorization scheme.
// - `failure.html`
// - `percent-encoding.window.js`
// - `toascii.window.js`
