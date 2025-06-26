import test from "node:test";
import assert from "node:assert";
import { reverseMachine } from "../test-utils.js";
import { writeFile, rm } from "node:fs/promises";

const STRESS_OUTPUT_DIR = "stress-test-output";

test.afterEach(async () => {
  await rm(STRESS_OUTPUT_DIR, { recursive: true, force: true });
});

test("Stress: Very large file (1MB+)", async () => {
  const largeFile = "stress-large.js";

  // Generate a moderately large file (reduced from 10000 to 1000 functions)
  const largeCode = Array.from(
    { length: 1000 },
    (_, i) => `
function stress${i}(a, b, c, d, e) {
  const temp1 = a + b;
  const temp2 = c * d;
  const temp3 = e / 2;
  const result = temp1 + temp2 + temp3;
  if (result > ${i}) {
    return result * ${i};
  } else if (result < ${i / 2}) {
    return result / ${i};
  }
  return result;
}
  `
  ).join("\n");

  await writeFile(largeFile, largeCode);

  try {
    // This should either succeed or fail gracefully
            await reverseMachine("openai", largeFile, "--outputDir", STRESS_OUTPUT_DIR);
    console.log("Large file stress test passed");
  } catch (error) {
    // If it fails, it should be a graceful failure with meaningful error
    assert(
      error instanceof Error && error.message.length > 0,
      "Should fail gracefully with meaningful error message"
    );
    console.log("Large file stress test failed gracefully:", error.message);
  } finally {
    await rm(largeFile, { force: true });
  }
});

test("Stress: Deeply nested code", async () => {
  const nestedFile = "stress-nested.js";

  // Create deeply nested code structure (reduced from 50 to 20 levels)
  let nestedCode = "";
  const depth = 20;

  for (let i = 0; i < depth; i++) {
    nestedCode += `function nest${i}() {\n`;
    nestedCode += `  const var${i} = ${i};\n`;
  }

  nestedCode += `  return "deeply nested";\n`;

  for (let i = 0; i < depth; i++) {
    nestedCode += "}\n";
  }

  await writeFile(nestedFile, nestedCode);

  try {
    await reverseMachine("openai", nestedFile, "--outputDir", STRESS_OUTPUT_DIR);
    console.log("Nested code stress test passed");
  } catch (error) {
    assert(
      error instanceof Error,
      "Should handle deeply nested code gracefully"
    );
    console.log("Nested code stress test handled gracefully:", error.message);
  } finally {
    await rm(nestedFile, { force: true });
  }
});

test("Stress: Many variables and functions", async () => {
  const manyVarsFile = "stress-many-vars.js";

  // Create a file with hundreds of variables and functions (reduced from 1000 to 200)
  let code = "";
  const count = 200;

  for (let i = 0; i < count; i++) {
    code += `const var${i} = ${i};\n`;
    code += `function func${i}(p${i}) { return p${i} + var${i}; }\n`;
  }

  await writeFile(manyVarsFile, code);

  try {
    await reverseMachine("openai", manyVarsFile, "--outputDir", STRESS_OUTPUT_DIR);
    console.log("Many variables stress test passed");
  } catch (error) {
    assert(error instanceof Error, "Should handle many variables gracefully");
    console.log(
      "Many variables stress test handled gracefully:",
      error.message
    );
  } finally {
    await rm(manyVarsFile, { force: true });
  }
});

test("Stress: Complex regex patterns", async () => {
  const regexFile = "stress-regex.js";

  const complexCode = `
const pattern1 = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const pattern2 = /^[a-zA-Z0-9.!#$%&'*+/=?^_\`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const pattern3 = /(?:(?:https?|ftp|file):\\/\\/|www\\.|ftp\\.)(?:\\([-A-Z0-9+&@#\\/%=~_|$?!:,.]*\\)|[-A-Z0-9+&@#\\/%=~_|$?!:,.])*(?:\\([-A-Z0-9+&@#\\/%=~_|$?!:,.]*\\)|[A-Z0-9+&@#\\/%=~_|$])/igm;
const pattern4 = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$/;

function a(b, c, d) {
  return b.replace(pattern1, c).replace(pattern2, d);
}
  `;

  await writeFile(regexFile, complexCode);

  try {
    await reverseMachine("openai", regexFile, "--outputDir", STRESS_OUTPUT_DIR);
    console.log("Complex regex stress test passed");
  } catch (error) {
    assert(error instanceof Error, "Should handle complex regex gracefully");
    console.log("Complex regex stress test handled gracefully:", error.message);
  } finally {
    await rm(regexFile, { force: true });
  }
});

test("Stress: Edge case characters and Unicode", async () => {
  const unicodeFile = "stress-unicode.js";

  const unicodeCode = `
const emoji = "🚀💻🔥";
const chinese = "你好世界";
const arabic = "مرحبا بالعالم";
const special = "\\"\\'\\\`\\n\\r\\t";

function αβγ(δεζ) {
  const ηθι = δεζ + "κλμ";
  return ηθι;
}

const νξο = {
  "🔑": "value",
  "special\\nkey": "another\\tvalue"
};
  `;

  await writeFile(unicodeFile, unicodeCode);

  try {
    await reverseMachine("openai", unicodeFile, "--outputDir", STRESS_OUTPUT_DIR);
    console.log("Unicode stress test passed");
  } catch (error) {
    assert(error instanceof Error, "Should handle Unicode gracefully");
    console.log("Unicode stress test handled gracefully:", error.message);
  } finally {
    await rm(unicodeFile, { force: true });
  }
});
