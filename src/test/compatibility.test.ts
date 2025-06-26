import test from "node:test";
import assert from "node:assert";
import { writeFile, rm, readFile } from "node:fs/promises";
import { reverseMachine } from "../test-utils.js";

const OUTPUT_DIR = "compatibility-test-output";

test.afterEach(async () => {
  await rm(OUTPUT_DIR, { recursive: true, force: true });
});

test("Compatibility: ES5 syntax", { skip: !process.env.OPENAI_API_KEY }, async () => {
  const es5File = "compat-es5.js";
  const es5Code = `
var a = function(b, c) {
  var d = b + c;
  return d;
};
var e = {
  f: function(g) { return g * 2; },
  h: a(1, 2)
};
  `;

  await writeFile(es5File, es5Code);

  try {
    await reverseMachine("openai", es5File, "--outputDir", OUTPUT_DIR);
    const output = await readFile(`${OUTPUT_DIR}/deobfuscated.js`, "utf-8");
    assert(output.includes("function"), "Should handle ES5 syntax");
  } finally {
    await rm(es5File, { force: true });
  }
});

test("Compatibility: ES6+ features", { skip: !process.env.OPENAI_API_KEY }, async () => {
  const es6File = "compat-es6.js";
  const es6Code = `
const a = (b, c) => b + c;
const d = {e, f: g => g * 2};
class h {
  constructor(i) { this.j = i; }
  k() { return this.j; }
}
const [l, m] = [1, 2];
const {n, o} = {n: 3, o: 4};
  `;

  await writeFile(es6File, es6Code);

  try {
    await reverseMachine("openai", es6File, "--outputDir", OUTPUT_DIR);
    const output = await readFile(`${OUTPUT_DIR}/deobfuscated.js`, "utf-8");
    assert(output.length > 0, "Should handle ES6+ features");
  } finally {
    await rm(es6File, { force: true });
  }
});

test("Compatibility: CommonJS modules", { skip: !process.env.OPENAI_API_KEY }, async () => {
  const cjsFile = "compat-cjs.js";
  const cjsCode = `
const a = require('path');
const b = require('./local-module');
module.exports = function(c, d) {
  return a.join(c, d);
};
exports.e = function(f) { return f * 2; };
  `;

  await writeFile(cjsFile, cjsCode);

  try {
    await reverseMachine("openai", cjsFile, "--outputDir", OUTPUT_DIR);
    const output = await readFile(`${OUTPUT_DIR}/deobfuscated.js`, "utf-8");
    assert(
      output.includes("require") || output.includes("module"),
      "Should handle CommonJS"
    );
  } finally {
    await rm(cjsFile, { force: true });
  }
});

test("Compatibility: Template literals and string interpolation", { skip: !process.env.OPENAI_API_KEY }, async () => {
  const templateFile = "compat-template.js";
  const templateCode = `
const a = "world";
const b = \`Hello \${a}!\`;
const c = \`
  Multi-line
  template \${a}
  string
\`;
function d(e) {
  return \`Result: \${e * 2}\`;
}
  `;

  await writeFile(templateFile, templateCode);

  try {
    await reverseMachine("openai", templateFile, "--outputDir", OUTPUT_DIR);
    const output = await readFile(`${OUTPUT_DIR}/deobfuscated.js`, "utf-8");
    assert(output.length > 0, "Should handle template literals");
  } finally {
    await rm(templateFile, { force: true });
  }
});

test("Compatibility: Async/await and promises", { skip: !process.env.OPENAI_API_KEY }, async () => {
  const asyncFile = "compat-async.js";
  const asyncCode = `
async function a(b) {
  const c = await b();
  return c * 2;
}
const d = async (e) => {
  try {
    const f = await a(() => Promise.resolve(e));
    return f;
  } catch (g) {
    return null;
  }
};
  `;

  await writeFile(asyncFile, asyncCode);

  try {
    await reverseMachine("openai", asyncFile, "--outputDir", OUTPUT_DIR);
    const output = await readFile(`${OUTPUT_DIR}/deobfuscated.js`, "utf-8");
    assert(
      output.includes("async") || output.includes("await"),
      "Should handle async/await"
    );
  } finally {
    await rm(asyncFile, { force: true });
  }
});

test("Compatibility: Generator functions", { skip: !process.env.OPENAI_API_KEY }, async () => {
  const genFile = "compat-gen.js";
  const genCode = `
function* a(b) {
  for (let c = 0; c < b; c++) {
    yield c * 2;
  }
}
const d = function*(e) {
  yield* a(e);
  yield "done";
};
  `;

  await writeFile(genFile, genCode);

  try {
    await reverseMachine("openai", genFile, "--outputDir", OUTPUT_DIR);
    const output = await readFile(`${OUTPUT_DIR}/deobfuscated.js`, "utf-8");
    assert(
      output.includes("function*") || output.includes("yield"),
      "Should handle generators"
    );
  } finally {
    await rm(genFile, { force: true });
  }
});

test("Compatibility: Symbols and iterators", { skip: !process.env.OPENAI_API_KEY }, async () => {
  const symbolFile = "compat-symbol.js";
  const symbolCode = `
const a = Symbol('test');
const b = Symbol.for('global');
const c = {
  [a]: 'value',
  [Symbol.iterator]: function*() {
    yield 1; yield 2; yield 3;
  }
};
  `;

  await writeFile(symbolFile, symbolCode);

  try {
    await reverseMachine("openai", symbolFile, "--outputDir", OUTPUT_DIR);
    const output = await readFile(`${OUTPUT_DIR}/deobfuscated.js`, "utf-8");
    assert(output.length > 0, "Should handle symbols");
  } finally {
    await rm(symbolFile, { force: true });
  }
});

test("Compatibility: Proxy and Reflect", { skip: !process.env.OPENAI_API_KEY }, async () => {
  const proxyFile = "compat-proxy.js";
  const proxyCode = `
const a = {b: 1, c: 2};
const d = new Proxy(a, {
  get(e, f) {
    return Reflect.get(e, f) * 2;
  },
  set(e, f, g) {
    return Reflect.set(e, f, g);
  }
});
  `;

  await writeFile(proxyFile, proxyCode);

  try {
    await reverseMachine("openai", proxyFile, "--outputDir", OUTPUT_DIR);
    const output = await readFile(`${OUTPUT_DIR}/deobfuscated.js`, "utf-8");
    assert(
      output.includes("Proxy") || output.includes("Reflect"),
      "Should handle Proxy/Reflect"
    );
  } finally {
    await rm(proxyFile, { force: true });
  }
});
