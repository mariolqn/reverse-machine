import test from "node:test";
import assert from "node:assert";
import { reverseMachine } from "../test-utils.js";
import { readFile, writeFile, rm, mkdir } from "node:fs/promises";
import { join } from "path";

const TEST_OUTPUT_DIR = "smoke-test-output";
const TEST_INPUT_FILE = "smoke-test-input.js";

test.beforeEach(async () => {
  await mkdir(TEST_OUTPUT_DIR, { recursive: true });
  // Create a minimal test file
  await writeFile(
    TEST_INPUT_FILE,
    `
function a(b,c){var d=b+c;return d*2}
const e=function(f){return f.toString()}
class g{constructor(h){this.i=h}j(){return this.i}}
  `.trim()
  );
});

test.afterEach(async () => {
  await rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
  await rm(TEST_INPUT_FILE, { force: true });
});

test("Smoke: CLI responds to --help", async () => {
  const result = await reverseMachine("--help");
  assert(result.stdout.includes("reverse-machine"), "Help should mention reverse-machine");
  assert(result.stdout.includes("Usage"), "Help should include usage");
});

test("Smoke: CLI responds to --version", async () => {
  const result = await reverseMachine("--version");
  assert(result.stdout.trim().length > 0, "Version should not be empty");
});

test("Smoke: Local command works without API keys", async () => {
  await reverseMachine("local", TEST_INPUT_FILE, "--outputDir", TEST_OUTPUT_DIR);

  const outputFile = join(TEST_OUTPUT_DIR, "deobfuscated.js");
  const content = await readFile(outputFile, "utf-8");
  assert(content.length > 0, "Local mode output file should not be empty");
});

test("Smoke: OpenAI command works with basic file", { skip: !process.env.OPENAI_API_KEY }, async () => {
  const result = await reverseMachine(
    "openai",
    TEST_INPUT_FILE,
    "--outputDir",
    TEST_OUTPUT_DIR
  );
  
  // Debug what we actually got
  console.log("STDOUT:", result.stdout);
  console.log("STDERR:", result.stderr);
  
  // Check if command completed (either success message or no error)
  const hasSuccess = result.stdout.includes("Successfully") || 
                    result.stdout.includes("completed") ||
                    result.stdout.includes("finished") ||
                    !result.stderr.includes("Error");
  assert(hasSuccess, "Should indicate success or completion");

  const outputFile = join(TEST_OUTPUT_DIR, "deobfuscated.js");
  const content = await readFile(outputFile, "utf-8");
  assert(content.length > 0, "Output file should not be empty");
  assert(content.includes("function"), "Should contain function keyword");
});

// Note: Download command removed with local model support

test("Smoke: Error handling for nonexistent file", async () => {
  await assert.rejects(
    reverseMachine("openai", "nonexistent-file.js"),
    /Error/,
    "Should throw error for nonexistent file"
  );
});

test("Smoke: Error handling for invalid command", async () => {
  await assert.rejects(
    reverseMachine("invalid-command"),
    /Error/,
    "Should throw error for invalid command"
  );
});

test("Smoke: Verbose flag works", { skip: !process.env.OPENAI_API_KEY }, async () => {
  const result = await reverseMachine(
    "openai",
    TEST_INPUT_FILE,
    "--verbose",
    "--outputDir",
    TEST_OUTPUT_DIR
  );
  // Verbose output usually contains more debug information
  assert(result.stdout.length > 100, "Verbose output should be substantial");
});

test("Smoke: Output directory creation", { skip: !process.env.OPENAI_API_KEY }, async () => {
  const customOutputDir = "custom-smoke-output";
  await reverseMachine("openai", TEST_INPUT_FILE, "--outputDir", customOutputDir);

  const outputFile = join(customOutputDir, "deobfuscated.js");
  const content = await readFile(outputFile, "utf-8");
  assert(content.length > 0, "Output file should exist in custom directory");

  await rm(customOutputDir, { recursive: true, force: true });
});
