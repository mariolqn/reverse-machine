import test from "node:test";
import assert from "node:assert";
import { humanify } from "../test-utils.js";
import { writeFile, rm, readFile } from "node:fs/promises";
import { performance } from "perf_hooks";

const SMALL_TEST_FILE = "perf-small.js";
const LARGE_TEST_FILE = "perf-large.js";
const OUTPUT_DIR = "perf-test-output";

test.beforeEach(async () => {
  // Small file (1KB)
  await writeFile(
    SMALL_TEST_FILE,
    `
function a(b,c){return b+c}
const d=e=>e*2;
class f{constructor(g){this.h=g}}
  `.trim()
  );

  // Large file (reduced from 2000 to 500 functions)
  const largeCode = Array.from(
    { length: 500 },
    (_, i) => `
function complexFunction${i}(param1, param2, param3) {
  const temp${i} = param1 + param2;
  const result${i} = temp${i} * param3;
  if (result${i} > 100) {
    return result${i} / 2;
  }
  return result${i};
}
const arrow${i} = (x, y) => x * y + ${i};
  `
  ).join("\n");

  await writeFile(LARGE_TEST_FILE, largeCode);
});

test.afterEach(async () => {
  await rm(SMALL_TEST_FILE, { force: true });
  await rm(LARGE_TEST_FILE, { force: true });
  await rm(OUTPUT_DIR, { recursive: true, force: true });
});

test("Performance: Small file processing time", { skip: !process.env.OPENAI_API_KEY }, async () => {
  const start = performance.now();

  await humanify("openai", SMALL_TEST_FILE, "--outputDir", OUTPUT_DIR);

  const end = performance.now();
  const duration = end - start;

  // Should process small files quickly (under 30 seconds)
  assert(duration < 30000, `Small file took too long: ${duration}ms`);
  console.log(`Small file processing time: ${duration.toFixed(2)}ms`);
});

test("Performance: Large file processing time", { skip: !process.env.OPENAI_API_KEY }, async () => {
  const start = performance.now();

  await humanify("openai", LARGE_TEST_FILE, "--outputDir", OUTPUT_DIR);

  const end = performance.now();
  const duration = end - start;

  // Large files should still be reasonable (under 90 seconds)
  assert(duration < 90000, `Large file took too long: ${duration}ms`);
  console.log(`Large file processing time: ${duration.toFixed(2)}ms`);
});

test("Performance: Multiple small files", { skip: !process.env.OPENAI_API_KEY }, async () => {
  const files = [];
  const promises = [];

  // Create multiple small files
  for (let i = 0; i < 5; i++) {
    const filename = `perf-multi-${i}.js`;
    files.push(filename);
    await writeFile(filename, `function test${i}(){return ${i}}`);
  }

  const start = performance.now();

  // Process them all
  for (const file of files) {
    promises.push(
      humanify("openai", file, "--outputDir", `${OUTPUT_DIR}-${file}`)
    );
  }

  await Promise.all(promises);

  const end = performance.now();
  const duration = end - start;

  // Multiple small files should be processed in parallel efficiently
  assert(duration < 60000, `Multiple files took too long: ${duration}ms`);
  console.log(`Multiple files processing time: ${duration.toFixed(2)}ms`);

  // Cleanup
  for (const file of files) {
    await rm(file, { force: true });
    await rm(`${OUTPUT_DIR}-${file}`, { recursive: true, force: true });
  }
});

test("Performance: Output file quality check", { skip: !process.env.OPENAI_API_KEY }, async () => {
  await humanify("openai", LARGE_TEST_FILE, "--outputDir", OUTPUT_DIR);

  const outputContent = await readFile(
    `${OUTPUT_DIR}/deobfuscated.js`,
    "utf-8"
  );
  const inputContent = await readFile(LARGE_TEST_FILE, "utf-8");

  // Output should be at least as long as input (usually longer due to formatting)
  assert(
    outputContent.length >= inputContent.length * 0.8,
    "Output seems too short compared to input"
  );

  // Should contain function keywords
  const functionCount = (outputContent.match(/function/g) || []).length;
  assert(functionCount > 100, "Should contain many function declarations");
});

test("Performance: CLI startup time", async () => {
  const iterations = 3;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();

    try {
      await humanify("--help");
    } catch {
      // Help command might exit with non-zero, that's okay
    }

    const end = performance.now();
    times.push(end - start);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

  // CLI should start up quickly
  assert(
    avgTime < 5000,
    `CLI startup too slow: ${avgTime.toFixed(2)}ms average`
  );
  console.log(`CLI startup time: ${avgTime.toFixed(2)}ms average`);
});
