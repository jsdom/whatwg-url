"use strict";
const fs = require("fs");

module.exports = targetDir => {
  try {
    fs.rmdirSync(targetDir, { recursive: true });
  } catch (e) {
    // Swallow ENOENT errors. They occur in Node.js v10 on CI because it does not support { recursive: true }.
    if (e.code !== "ENOENT") {
      throw e;
    }
  }

  fs.mkdirSync(targetDir, { recursive: true });
};
