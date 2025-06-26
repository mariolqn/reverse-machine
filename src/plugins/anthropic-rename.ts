import { visitAllIdentifiers } from "./local-llm-rename/visit-all-identifiers.js";
import { SecureLogger } from "../security/secure-logger.js";
import { parseAnthropicResponse } from "../security/secure-json.js";
import { showPercentage } from "../progress.js";

export function anthropicRename({
  apiKey,
  model: modelName
}: {
  apiKey: string;
  model: string;
}) {
  return async (code: string): Promise<string> => {
    // Dynamic import to avoid TypeScript declaration issues
    let Anthropic: any;
    try {
      // @ts-ignore - Dynamic import for optional dependency
      const anthropicModule = await import("@anthropic-ai/sdk");
      Anthropic = anthropicModule.default;
    } catch (error) {
      SecureLogger.error("Failed to import Anthropic SDK module", { error });
      return code; // Return original code if import fails
    }

    const client = new Anthropic({ apiKey });

    return await visitAllIdentifiers(
      code,
      async (name, surroundingCode) => {
        SecureLogger.debug(`Renaming ${name}`);
        SecureLogger.debug("Context: ", { contextLength: surroundingCode.length });

        try {
          const response = await client.messages.create({
            model: modelName,
            max_tokens: 150,
            system: `You are a code assistant that renames JavaScript variables and functions. Rename the variable/function "${name}" to have a descriptive name based on its usage in the provided code. Respond with a JSON object in the format: {"newName": "descriptiveName"}`,
            messages: [
              {
                role: "user",
                content: `Please analyze this JavaScript code and suggest a descriptive name for the variable/function "${name}" based on its usage:\n\n${surroundingCode}`
              }
            ]
          });

          const result = response.content[0];
          if (result.type === 'text') {
            const parsed = parseAnthropicResponse(result.text);
            SecureLogger.debug(`Renamed to ${parsed.newName}`);
            return parsed.newName;
          } else {
            SecureLogger.error("Unexpected response type from Anthropic", { type: result.type });
            return name;
          }
        } catch (error) {
          SecureLogger.error("Failed to rename variable with Anthropic", { 
            error: (error as Error).message,
            variableName: name 
          });
          return name; // Fallback to original name
        }
      },
      showPercentage
    );
  };
} 