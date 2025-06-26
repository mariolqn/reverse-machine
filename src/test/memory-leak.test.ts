import test from "node:test";
import assert from "node:assert";
import { humanify } from "../test-utils.js";
import { writeFile, rm } from "node:fs/promises";

const TEST_FILE = "memory-test.js";

test.beforeEach(async () => {
  // Create a larger test file to stress memory
  const largeCode = `
function complexFunction${Array.from({ length: 1000 }, (_, i) => `
function fn${i}(a${i}, b${i}) {
  const result${i} = a${i} + b${i};
  return result${i} * ${i};
}
`).join("")}
  `.trim();
  
  await writeFile(TEST_FILE, largeCode);
});

test.afterEach(async () => {
  await rm(TEST_FILE, { force: true });
  await rm("memory-test-output", { recursive: true, force: true });
});

test("Memory: Local processing doesn't leak memory", async () => {
  if (global.gc) {
    global.gc();
  }
  
  const initialMemory = process.memoryUsage().heapUsed;
  
  // Run multiple iterations
  for (let i = 0; i < 5; i++) {
    await humanify("local", TEST_FILE, "--outputDir", "memory-test-output");
    
    if (global.gc) {
      global.gc();
    }
    
    const currentMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = currentMemory - initialMemory;
    
    // Allow reasonable memory growth but flag excessive leaks
    assert(
      memoryIncrease < 100 * 1024 * 1024, // 100MB
      `Memory leak detected: ${memoryIncrease / 1024 / 1024}MB increase`
    );
  }
});

test("Memory: RSS memory stays within bounds", async () => {
  const initialRSS = process.memoryUsage().rss;
  
  await humanify("local", TEST_FILE, "--outputDir", "memory-test-output");
  
  const finalRSS = process.memoryUsage().rss;
  const rssIncrease = finalRSS - initialRSS;
  
  // Allow reasonable RSS growth
  assert(
    rssIncrease < 500 * 1024 * 1024, // 500MB
    `Excessive RSS memory usage: ${rssIncrease / 1024 / 1024}MB increase`
  );
});

test("Memory: External memory stays reasonable", async () => {
  const initialExternal = process.memoryUsage().external;
  
  await humanify("local", TEST_FILE, "--outputDir", "memory-test-output");
  
  const finalExternal = process.memoryUsage().external;
  const externalIncrease = finalExternal - initialExternal;
  
  assert(
    externalIncrease < 50 * 1024 * 1024, // 50MB
    `Excessive external memory usage: ${externalIncrease / 1024 / 1024}MB increase`
  );
}); 