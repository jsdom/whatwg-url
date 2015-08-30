"use strict";

const fs = require("fs");
const recast = require("recast");
const types = recast.types;

const code = fs.readFileSync(__dirname + "/../src/url.js", { encoding: "utf8" });
const ast = recast.parse(code);

function replaceP(body) {
  types.visit(body, {
    visitFunction: function (path) {
      if (path.node.id && path.node.id.name === "p") {
        path.replace();
        return false;
      }

      this.traverse(path);
    },

    visitCallExpression: function (path) {
      if (path.node.callee.name === "p") {
        const codePoint = path.node.arguments[0].value.codePointAt(0);
        path.replace(types.builders.literal(codePoint));
      }

      this.traverse(path);
    }
  });
}

replaceP(ast.program.body);

const output = recast.print(ast).code;
fs.writeFileSync(__dirname + "/../lib/url.js", output);
