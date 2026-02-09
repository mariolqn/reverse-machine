// Using a simpler approach without external dependencies for compatibility
// import Ajv, { JSONSchemaType } from "ajv";
// import addFormats from "ajv-formats";
import { SecurityError } from "./input-validator.js";

// Simple JSON schema type definitions
export interface OpenAIRenameResponse {
  renamedVariables: Array<{ oldName: string; newName: string }>;
}

export interface GeminiResponse {
  newName: string;
}

export interface AnthropicResponse {
  newName: string;
}

// Maximum JSON string length to prevent DoS
const MAX_JSON_LENGTH = 10 * 1024 * 1024; // 10MB

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Validates OpenAI rename response structure
 */
function validateOpenAIResponse(data: any): data is OpenAIRenameResponse {
  if (!data || typeof data !== "object") return false;
  if (!Array.isArray(data.renamedVariables)) return false;

  return data.renamedVariables.every(
    (item: any) =>
      item &&
      typeof item === "object" &&
      typeof item.oldName === "string" &&
      typeof item.newName === "string" &&
      item.oldName.length > 0 &&
      item.oldName.length <= 100 &&
      item.newName.length > 0 &&
      item.newName.length <= 100
  );
}

/**
 * Validates Gemini response structure
 */
function validateGeminiResponse(data: any): data is GeminiResponse {
  return (
    data &&
    typeof data === "object" &&
    typeof data.newName === "string" &&
    data.newName.length > 0 &&
    data.newName.length <= 100
  );
}

/**
 * Validates Anthropic response structure
 */
function validateAnthropicResponse(data: any): data is AnthropicResponse {
  return (
    data &&
    typeof data === "object" &&
    typeof data.newName === "string" &&
    data.newName.length > 0 &&
    data.newName.length <= 100
  );
}

/**
 * Safely parses JSON with validation and security checks
 */
export function parseSecureJSON<T>(
  jsonString: string,
  validator: (data: any) => data is T,
  context: string = "JSON"
): T {
  // Check input length to prevent DoS
  if (jsonString.length > MAX_JSON_LENGTH) {
    throw new SecurityError(
      `${context} too large. Maximum size: ${MAX_JSON_LENGTH / 1024 / 1024}MB`
    );
  }

  // Check for potential prototype pollution patterns
  const dangerousPatterns = [
    /__proto__/i,
    /"constructor"/i,
    /"prototype"/i,
    /\\u005f\\u005f/i, // encoded __
    /\\x5f\\x5f/i // hex encoded __
  ];

  if (dangerousPatterns.some((pattern) => pattern.test(jsonString))) {
    throw new SecurityError(
      `${context} contains potentially dangerous patterns`
    );
  }

  let parsed: unknown;
  try {
    // Use reviver function to prevent prototype pollution
    parsed = JSON.parse(jsonString, (key, value) => {
      // Block dangerous property names
      if (
        typeof key === "string" &&
        (key === "__proto__" || key === "constructor" || key === "prototype")
      ) {
        return undefined;
      }
      return value;
    });
  } catch (error) {
    throw new SecurityError(
      `Invalid ${context} format: ${(error as Error).message}`
    );
  }

  // Validate using provided validator function
  if (!validator(parsed)) {
    throw new SecurityError(`${context} schema validation failed`);
  }

  return parsed as T;
}

/**
 * Parses model JSON responses with prototype-pollution protection.
 * This parser is intentionally permissive on values to allow code payloads.
 */
export function parseModelJSON<T>(
  jsonString: string,
  context: string,
  validator?: (data: unknown) => data is T
): T {
  if (jsonString.length > MAX_JSON_LENGTH) {
    throw new SecurityError(
      `${context} too large. Maximum size: ${MAX_JSON_LENGTH / 1024 / 1024}MB`
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString, (key, value) => {
      if (
        typeof key === "string" &&
        (key === "__proto__" || key === "constructor" || key === "prototype")
      ) {
        throw new SecurityError(
          `${context} contains potentially dangerous key: ${key}`
        );
      }
      return value;
    });
  } catch (error) {
    if (error instanceof SecurityError) {
      throw error;
    }
    throw new SecurityError(
      `Invalid ${context} format: ${(error as Error).message}`
    );
  }

  if (!isJsonObject(parsed)) {
    throw new SecurityError(`${context} must be a JSON object`);
  }

  if (validator && !validator(parsed)) {
    throw new SecurityError(`${context} schema validation failed`);
  }

  return parsed as T;
}

export function parseModelObject(
  jsonString: string,
  context: string
): Record<string, unknown> {
  return parseModelJSON<Record<string, unknown>>(
    jsonString,
    context,
    (data): data is Record<string, unknown> => isJsonObject(data)
  );
}

// Export specific parsers for convenience
export function parseOpenAIResponse(jsonString: string): OpenAIRenameResponse {
  return parseModelJSON(
    jsonString,
    "OpenAI API response",
    validateOpenAIResponse
  );
}

export function parseGeminiResponse(jsonString: string): GeminiResponse {
  return parseModelJSON(
    jsonString,
    "Gemini API response",
    validateGeminiResponse
  );
}

export function parseAnthropicResponse(jsonString: string): AnthropicResponse {
  return parseModelJSON(
    jsonString,
    "Anthropic API response",
    validateAnthropicResponse
  );
}

/**
 * Creates a safe JSON string with size limits
 */
export function stringifySecureJSON(obj: any): string {
  const jsonString = JSON.stringify(obj);

  if (jsonString.length > MAX_JSON_LENGTH) {
    throw new SecurityError(
      `JSON output too large. Maximum size: ${MAX_JSON_LENGTH / 1024 / 1024}MB`
    );
  }

  return jsonString;
}
