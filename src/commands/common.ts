import os from "node:os";
import { CliProblem } from "../cli-error.js";
import {
  SecurityError,
  validateInputFile
} from "../security/input-validator.js";

const MAX_CONCURRENCY = Math.max(1, os.cpus().length * 2);

export function defaultConcurrency(): string {
  return String(Math.max(1, os.cpus().length));
}

export function parseConcurrency(value: string): number {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_CONCURRENCY) {
    throw new CliProblem(
      "invalid_input",
      `Invalid --concurrency value "${value}". Expected an integer between 1 and ${MAX_CONCURRENCY}.`
    );
  }

  return parsed;
}

export function normalizeOutputDir(
  opts: Record<string, unknown>
): string | undefined {
  const outputDir = opts.outputDir;
  if (outputDir == null || outputDir === "") {
    return undefined;
  }

  if (typeof outputDir !== "string") {
    throw new CliProblem("invalid_input", "Output directory must be a string.");
  }

  return outputDir;
}

export function validateInputForCommand(inputPath: string): void {
  validateInputFile(inputPath);
}

export function requireApiKey(
  apiKey: string | undefined,
  provider: "OpenAI" | "Gemini" | "Anthropic"
): string {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new CliProblem(
      "missing_api_key",
      `${provider} API key is required. Pass --apiKey or set the corresponding environment variable.`
    );
  }

  return apiKey.trim();
}

export function toCliProblem(error: unknown): CliProblem {
  if (error instanceof CliProblem) {
    return error;
  }

  if (error instanceof SecurityError) {
    return new CliProblem("invalid_input", error.message);
  }

  const detail = error instanceof Error ? error.message : String(error);
  return new CliProblem("processing_failed", detail);
}
