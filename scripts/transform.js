"use strict";

const fs = require("fs");
const path = require("path");
const recast = require("recast");
const types = recast.types;

function replaceP(body) {
  types.visit(body, {
    /* eslint-disable consistent-return */
    visitFunction(p) {
      if (p.node.id && p.node.id.name === "p") {
        p.replace();
        return false;
      }

      this.traverse(p);
    },

    visitCallExpression(p) {
      if (p.node.callee.name === "p") {
        const codePoint = p.node.arguments[0].value.codePointAt(0);
        p.replace(types.builders.literal(codePoint));
      }

      this.traverse(p);
    }
  });
}

for (const file of ["urlencoded.js", "url-state-machine.js"]) {
  const code = fs.readFileSync(path.resolve(__dirname, "../src", file), { encoding: "utf8" });
  const ast = recast.parse(code);
  replaceP(ast.program.body);
  const output = recast.print(ast).code;
  fs.writeFileSync(path.resolve(__dirname, "../lib", file), output);
}
