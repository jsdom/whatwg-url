import domenicConfig from "@domenic/eslint-config";
import domenicStylisticConfig from "@domenic/eslint-config/stylistic";
import globals from "globals";

export default [
  {
    ignores: [
      "_site/",
      "coverage/",
      "lib/Function.js",
      "lib/URL.js",
      "lib/URLSearchParams.js",
      "lib/VoidFunction.js",
      "lib/utils.js",
      "live-viewer/whatwg-url.mjs",
      "test/web-platform-tests/",
    ],
  },
  ...domenicConfig,
  ...domenicStylisticConfig,
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node,
    },
  },
  {
    files: ["**/*.mjs"],
    ignores: ["live-viewer/**"],
    languageOptions: {
      globals: globals.nodeBuiltin,
    },
  },
  {
    files: ["live-viewer/**.mjs"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ["scripts/**/*.mjs"],
    rules: {
      "no-console": "off",
    },
  },
];
