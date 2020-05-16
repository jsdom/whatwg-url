"use strict";
const fs = require("fs");

module.exports = targetDir => {
  try {
    fs.rmdirSync(targetDir, { recursive: true });
  } catch (e) {
    // Swallow these errors. They occur in Node.js v10 on CI because it does not support { recursive: true }.
    // In that case we'll just have some leftover files on CI; it's not a big deal, and the other CI runs (on later
    // Node.js versions) will validate that we aren't relying on them.
    if (e.code !== "ENOENT" && e.code !== "ENOTEMPTY") {
      throw e;
    }
  }

  fs.mkdirSync(targetDir, { recursive: true });
};
