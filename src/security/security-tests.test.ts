import test from "node:test";
import assert from "node:assert";
import { validateInputFile, validateOutputPath, SecurityError } from "./input-validator.js";
import { parseSecureJSON, OpenAIRenameSchema } from "./secure-json.js";
import { SecureLogger } from "./secure-logger.js";
import { transformWithPlugins } from "../babel-utils.js";
import { writeFileSync, unlinkSync, mkdirSync, rmSync } from "fs";
import { join } from "path";

test("Security: Path traversal prevention", async () => {
  // Test path traversal attacks
  assert.throws(() => {
    validateInputFile("../../../etc/passwd");
  }, SecurityError);

  assert.throws(() => {
    validateInputFile("../../../../usr/bin/sh");
  }, SecurityError);

  // Test valid files (create temporary file for testing)
  const validFile = "test-input.js";
  writeFileSync(validFile, "console.log('test');");
  
  try {
    const result = validateInputFile(validFile);
    assert(result.endsWith(validFile));
  } finally {
    unlinkSync(validFile);
  }
});

test("Security: Output directory validation", async () => {
  // Test dangerous output directories
  assert.throws(() => {
    validateOutputPath("/etc");
  }, SecurityError);

  assert.throws(() => {
    validateOutputPath("/usr/bin");
  }, SecurityError);

  // Test valid output directory
  const validDir = "test-output";
  try {
    const result = validateOutputPath(validDir);
    assert(result.endsWith(validDir));
  } finally {
    rmSync(validDir, { recursive: true, force: true });
  }
});

test("Security: JSON parsing with prototype pollution protection", async () => {
  // Test prototype pollution attempts
  const maliciousJSON = '{"__proto__": {"polluted": true}, "renamedVariables": []}';
  
  assert.throws(() => {
    parseSecureJSON(maliciousJSON, OpenAIRenameSchema);
  }, SecurityError);

  // Test constructor pollution
  const constructorJSON = '{"constructor": {"prototype": {"polluted": true}}, "renamedVariables": []}';
  
  assert.throws(() => {
    parseSecureJSON(constructorJSON, OpenAIRenameSchema);
  }, SecurityError);

  // Test valid JSON
  const validJSON = '{"renamedVariables": [{"oldName": "a", "newName": "count"}]}';
  const result = parseSecureJSON(validJSON, OpenAIRenameSchema);
  assert.strictEqual(result.renamedVariables[0].oldName, "a");
  assert.strictEqual(result.renamedVariables[0].newName, "count");
});

test("Security: Secure logging redacts sensitive information", async () => {
  let logOutput = "";
  const originalLog = console.log;
  console.log = (...args) => {
    logOutput += args.join(" ") + "\n";
  };

  try {
    SecureLogger.enableVerbose();
    
    // Test API key redaction
    SecureLogger.info("Processing with key", { apiKey: "sk-1234567890abcdef" });
    assert(logOutput.includes("[REDACTED]"));
    assert(!logOutput.includes("sk-1234567890abcdef"));

    // Test password redaction  
    logOutput = "";
    SecureLogger.debug("Login attempt", { password: "secret123" });
    assert(logOutput.includes("[REDACTED]"));
    assert(!logOutput.includes("secret123"));

  } finally {
    console.log = originalLog;
  }
});

test("Security: Babel transformation safety checks", async () => {
  // Test dangerous code patterns
  const dangerousCode = `
    const fs = require('fs');
    fs.readFileSync('/etc/passwd');
  `;

  await assert.rejects(async () => {
    await transformWithPlugins(dangerousCode, []);
  }, SecurityError);

  // Test eval injection
  const evalCode = `
    eval('process.exit(1)');
  `;

  await assert.rejects(async () => {
    await transformWithPlugins(evalCode, []);
  }, SecurityError);

  // Test safe code
  const safeCode = `
    function add(a, b) {
      return a + b;
    }
  `;

  const result = await transformWithPlugins(safeCode, []);
  assert(typeof result === "string");
  assert(result.includes("function add"));
});

test("Security: File size limits", async () => {
  // Test large file rejection
  const largeFile = "large-test.js";
  const largeContent = "a".repeat(200 * 1024 * 1024); // 200MB
  
  writeFileSync(largeFile, largeContent);
  
  try {
    assert.throws(() => {
      validateInputFile(largeFile);
    }, SecurityError);
  } finally {
    unlinkSync(largeFile);
  }
});

test("Security: File extension validation", async () => {
  // Test invalid file extensions
  const invalidFile = "test.exe";
  writeFileSync(invalidFile, "content");
  
  try {
    assert.throws(() => {
      validateInputFile(invalidFile);
    }, SecurityError);
  } finally {
    unlinkSync(invalidFile);
  }

  // Test valid extension
  const validFile = "test.js";
  writeFileSync(validFile, "console.log('test');");
  
  try {
    const result = validateInputFile(validFile);
    assert(result.endsWith(validFile));
  } finally {
    unlinkSync(validFile);
  }
});

test("Security: JSON schema validation", async () => {
  // Test missing required fields
  const incompleteJSON = '{"renamedVariables": [{"oldName": "a"}]}';
  
  assert.throws(() => {
    parseSecureJSON(incompleteJSON, OpenAIRenameSchema);
  }, SecurityError);

  // Test invalid field types
  const invalidTypeJSON = '{"renamedVariables": [{"oldName": 123, "newName": "count"}]}';
  
  assert.throws(() => {
    parseSecureJSON(invalidTypeJSON, OpenAIRenameSchema);
  }, SecurityError);

  // Test string length limits
  const tooLongJSON = `{"renamedVariables": [{"oldName": "${"a".repeat(200)}", "newName": "count"}]}`;
  
  assert.throws(() => {
    parseSecureJSON(tooLongJSON, OpenAIRenameSchema);
  }, SecurityError);
}); 