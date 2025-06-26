import assert from "node:assert";
import test from "node:test";
import { reverseMachine } from "./test-utils.js";

for (const cmd of ["openai", "anthropic", "gemini"]) {
  test(`${cmd} throws error on missing file`, async () => {
    await assert.rejects(reverseMachine(cmd, "nonexistent-file.js"));
  });
}
