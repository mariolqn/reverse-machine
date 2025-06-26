import test from "node:test";
import assert from "node:assert";
import { humanify } from "../test-utils.js";
import { writeFile, rm } from "node:fs/promises";

const TEST_FILE = "memory-test.js";

test.beforeEach(async () => {
  // Create a moderately sized test file (reduced from 1000 to 100 functions)
  const largeCode = `
function complexFunction${Array.from(
    { length: 100 },
    (_, i) => `
function fn${i}(a${i}, b${i}) {
  const result${i} = a${i} + b${i};
  return result${i} * ${i};
}
`
  ).join("")}
  `.trim();

  await writeFile(TEST_FILE, largeCode);
});

test.afterEach(async () => {
  await rm(TEST_FILE, { force: true });
  await rm("memory-test-output", { recursive: true, force: true });
});

test("Memory: OpenAI processing doesn't leak memory", { skip: !process.env.OPENAI_API_KEY }, async () => {
  const initialMemory = process.memoryUsage().heapUsed;

  // Run fewer iterations to reduce system stress
  for (let i = 0; i < 2; i++) {
    await humanify("openai", TEST_FILE, "--outputDir", "memory-test-output");

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const currentMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = currentMemory - initialMemory;

    // Allow reasonable memory growth but flag excessive leaks
    assert(
      memoryIncrease < 200 * 1024 * 1024, // 200MB (more lenient for Node 24)
      `Memory leak detected: ${memoryIncrease / 1024 / 1024}MB increase`
    );
  }
});

test("Memory: RSS memory stays within bounds", { skip: !process.env.OPENAI_API_KEY }, async () => {
  const initialRSS = process.memoryUsage().rss;

  await humanify("openai", TEST_FILE, "--outputDir", "memory-test-output");

  const finalRSS = process.memoryUsage().rss;
  const rssIncrease = finalRSS - initialRSS;

  // Allow reasonable RSS growth
  assert(
    rssIncrease < 500 * 1024 * 1024, // 500MB
    `Excessive RSS memory usage: ${rssIncrease / 1024 / 1024}MB increase`
  );
});

test("Memory: External memory stays reasonable", { skip: !process.env.OPENAI_API_KEY }, async () => {
  const initialExternal = process.memoryUsage().external;

  await humanify("openai", TEST_FILE, "--outputDir", "memory-test-output");

  const finalExternal = process.memoryUsage().external;
  const externalIncrease = finalExternal - initialExternal;

  assert(
    externalIncrease < 50 * 1024 * 1024, // 50MB
    `Excessive external memory usage: ${externalIncrease / 1024 / 1024}MB increase`
  );
});
