import domenicConfig from "@domenic/eslint-config";
import globals from "globals";
export default [
  {
    ignores: [
      "coverage/",
      "test/web-platform-tests/",
      "live-viewer/whatwg-url.mjs",
      "lib/VoidFunction.js",
      "lib/Function.js",
      "lib/URL.js",
      "lib/URLSearchParams.js",
      "lib/utils.js"
    ]
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node
    }
  },
  {
    files: ["live-viewer/**.mjs"],
    languageOptions: {
      sourceType: "module",
      globals: globals.browser
    }
  },
  ...domenicConfig,
  {
    files: ["scripts/**.js"],
    rules: {
      "no-console": "off"
    }
  }
];
