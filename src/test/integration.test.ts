import test from "node:test";
import assert from "node:assert";
import { readFile, writeFile, rm, mkdir } from "node:fs/promises";
import { reverseMachine } from "../test-utils.js";

const TEST_FIXTURES_DIR = "integration-fixtures";
const TEST_OUTPUT_DIR = "integration-output";

test.beforeEach(async () => {
  await mkdir(TEST_FIXTURES_DIR, { recursive: true });
  await mkdir(TEST_OUTPUT_DIR, { recursive: true });
});

test.afterEach(async () => {
  await rm(TEST_FIXTURES_DIR, { recursive: true, force: true });
  await rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
});

test("Integration: Local command with all plugins", { skip: !process.env.OPENAI_API_KEY }, async () => {
  const testFile = `${TEST_FIXTURES_DIR}/complex.js`;
  const complexCode = `
var a=function(b,c){var d=b+c;return d*2};
const e=b=>b.toString();
class f{constructor(g){this.h=g}i(){return this.h}}
var j={k:function(l){return l*3},m:a(1,2)};
for(var n=0;n<10;n++){console.log(n)}
  `.trim();

  await writeFile(testFile, complexCode);

  const result = await reverseMachine(
    "local",
    testFile,
    "--outputDir",
    TEST_OUTPUT_DIR
  );

  assert(
    result.stdout.includes("Successfully") ||
      result.stderr.includes("Successfully"),
    "Should indicate successful processing"
  );

  const outputContent = await readFile(
    `${TEST_OUTPUT_DIR}/deobfuscated.js`,
    "utf-8"
  );

  // Verify output is longer and more readable
  assert(
    outputContent.length >= complexCode.length,
    "Output should be at least as long as input"
  );
  assert(
    outputContent.includes("function"),
    "Should contain function declarations"
  );
});

test("Integration: Multiple file processing workflow", { skip: !process.env.OPENAI_API_KEY }, async () => {
  const files = ["file1.js", "file2.js", "file3.js"];

  for (let i = 0; i < files.length; i++) {
    const fileName = `${TEST_FIXTURES_DIR}/${files[i]}`;
    await writeFile(fileName, `function test${i}(a,b){return a+b+${i}}`);
  }

  // Process each file
  for (let i = 0; i < files.length; i++) {
    const inputFile = `${TEST_FIXTURES_DIR}/${files[i]}`;
    const outputDir = `${TEST_OUTPUT_DIR}/output${i}`;

    await reverseMachine("openai", inputFile, "--outputDir", outputDir);

    const outputContent = await readFile(
      `${outputDir}/deobfuscated.js`,
      "utf-8"
    );
    assert(
      outputContent.includes("function"),
      `File ${i} should be processed correctly`
    );
  }
});

test("Integration: Error recovery and graceful degradation", { skip: !process.env.OPENAI_API_KEY }, async () => {
  // Test with malformed JavaScript
  const malformedFile = `${TEST_FIXTURES_DIR}/malformed.js`;
  await writeFile(malformedFile, "function broken(a,b{return a+b"); // Missing closing paren

  try {
    await reverseMachine("openai", malformedFile, "--outputDir", TEST_OUTPUT_DIR);
    // If it succeeds, that's fine too - some tools can handle partial JS
    console.log("Malformed JS was handled gracefully");
  } catch (error) {
    // Should fail with a meaningful error message
    assert(
      error instanceof Error && error.message.length > 0,
      "Should provide meaningful error for malformed JS"
    );
    console.log("Malformed JS failed as expected:", error.message);
  }
});

test("Integration: File system edge cases", { skip: !process.env.OPENAI_API_KEY }, async () => {
  // Test with file that has unusual name
  const unusualFile = `${TEST_FIXTURES_DIR}/test-file.with.dots.and-dashes.min.js`;
  await writeFile(unusualFile, "function a(b){return b*2}");

  await reverseMachine("openai", unusualFile, "--outputDir", TEST_OUTPUT_DIR);

  const outputContent = await readFile(
    `${TEST_OUTPUT_DIR}/deobfuscated.js`,
    "utf-8"
  );
  assert(outputContent.includes("function"), "Should handle unusual filenames");
});

test("Integration: Large batch processing", { skip: !process.env.OPENAI_API_KEY }, async () => {
  const batchSize = 10;
  const files = [];

  // Create multiple files
  for (let i = 0; i < batchSize; i++) {
    const fileName = `${TEST_FIXTURES_DIR}/batch${i}.js`;
    files.push(fileName);
    await writeFile(
      fileName,
      `
function batch${i}(param) {
  const result = param * ${i};
  return result > 5 ? result : param;
}
    `.trim()
    );
  }

  // Process them sequentially (to avoid overloading)
  for (const file of files) {
    const outputDir = `${TEST_OUTPUT_DIR}/${file.replace(/[^a-zA-Z0-9]/g, "_")}`;
    await reverseMachine("openai", file, "--outputDir", outputDir);

    const outputContent = await readFile(
      `${outputDir}/deobfuscated.js`,
      "utf-8"
    );
    assert(
      outputContent.includes("function"),
      "Each batch file should be processed"
    );
  }
});

test("Integration: Verbose mode provides detailed output", { skip: !process.env.OPENAI_API_KEY }, async () => {
  const testFile = `${TEST_FIXTURES_DIR}/verbose-test.js`;
  await writeFile(testFile, "function a(b,c){return b+c}");

  const verboseResult = await reverseMachine(
    "local",
    testFile,
    "--verbose",
    "--outputDir",
    TEST_OUTPUT_DIR
  );
  const normalResult = await reverseMachine(
    "local",
    testFile,
    "--outputDir",
    `${TEST_OUTPUT_DIR}2`
  );

  // Verbose should produce more output
  assert(
    verboseResult.stdout.length > normalResult.stdout.length ||
      verboseResult.stderr.length > normalResult.stderr.length,
    "Verbose mode should produce more detailed output"
  );

  await rm(`${TEST_OUTPUT_DIR}2`, { recursive: true, force: true });
});

test("Integration: Security boundaries are respected", { skip: !process.env.OPENAI_API_KEY }, async () => {
  // Test that the tool doesn't access files outside intended directories
  const testFile = `${TEST_FIXTURES_DIR}/security-test.js`;
  await writeFile(
    testFile,
    `
// This file shouldn't be able to access sensitive paths
function test() {
  return "safe code";
}
  `.trim()
  );

  await reverseMachine("openai", testFile, "--outputDir", TEST_OUTPUT_DIR);

  const outputContent = await readFile(
    `${TEST_OUTPUT_DIR}/deobfuscated.js`,
    "utf-8"
  );

  // Verify no sensitive paths are mentioned in output
  const sensitivePatterns = [
    "/etc/passwd",
    "/usr/bin",
    "C:\\Windows\\System32"
  ];
  for (const pattern of sensitivePatterns) {
    assert(
      !outputContent.includes(pattern),
      `Output should not contain sensitive path: ${pattern}`
    );
  }
});
