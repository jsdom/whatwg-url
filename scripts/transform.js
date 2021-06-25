"use strict";

const fs = require("fs");
const path = require("path");
const recast = require("recast");
const glob = require("glob");
const WebIDL2JS = require("webidl2js");

const srcDir = path.resolve(__dirname, "../src");
const outputDir = path.resolve(__dirname, "../dist");

(fs.rmSync || fs.rmdirSync)(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const file of glob.sync(`${srcDir}/*.js`)) {
  const code = fs.readFileSync(file, { encoding: "utf8" });
  const ast = recast.parse(code);
  replaceP(ast.program.body);
  const output = recast.print(ast, { lineTerminator: "\n" }).code;

  const outputFile = path.resolve(outputDir, path.relative(srcDir, file));
  fs.writeFileSync(outputFile, output);
}

const transformer = new WebIDL2JS({ implSuffix: "-impl" });

transformer.addSource(srcDir, outputDir);
transformer.generate(outputDir)
  .catch(err => {
    console.error(err.stack);
    process.exit(1);
  });

function replaceP(body) {
  recast.types.visit(body, {
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
        p.replace(recast.types.builders.literal(codePoint));
      }

      this.traverse(p);
    }
  });
}
