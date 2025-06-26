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

    // Determine if this is a reasoning model and configure accordingly
    const isReasoningModel = modelName.includes('reasoning');
    const actualModelName = isReasoningModel ? 
      modelName.replace('-reasoning', '') : 
      modelName;

    return await visitAllIdentifiers(
      code,
      async (name, surroundingCode) => {
        SecureLogger.debug(`Renaming ${name} with model: ${actualModelName}${isReasoningModel ? ' (reasoning)' : ''}`);
        SecureLogger.debug("Context: ", { contextLength: surroundingCode.length });

        try {
          const requestBody: any = {
            model: actualModelName,
            max_tokens: isReasoningModel ? 1000 : 150, // More tokens for reasoning models
            system: `You are a code assistant that renames JavaScript variables and functions. Rename the variable/function "${name}" to have a descriptive name based on its usage in the provided code. ${isReasoningModel ? 'Think through your reasoning step by step before providing the answer.' : ''} Respond with a JSON object in the format: {"newName": "descriptiveName"}`,
            messages: [
              {
                role: "user",
                content: `Please analyze this JavaScript code and suggest a descriptive name for the variable/function "${name}" based on its usage:\n\n${surroundingCode}`
              }
            ]
          };

          // Add reasoning-specific parameters for Claude 4 models
          if (isReasoningModel && (actualModelName.includes('claude-4-opus') || actualModelName.includes('claude-4-sonnet'))) {
            // Enable extended thinking for Claude 4 reasoning models
            requestBody.anthropic_beta = "thinking-2024-12-04";
            requestBody.thinking = true;
          }

          const response = await client.messages.create(requestBody);

          const result = response.content[0];
          if (result.type === 'text') {
            let responseText = result.text;
            
            // For reasoning models, extract the final answer from thinking tags if present
            if (isReasoningModel && responseText.includes('<thinking>')) {
              const thinkingMatch = responseText.match(/<\/thinking>([\s\S]*?)$/);
              if (thinkingMatch) {
                responseText = thinkingMatch[1].trim();
                SecureLogger.debug("Extracted answer from reasoning response");
              }
            }
            
            const parsed = parseAnthropicResponse(responseText);
            SecureLogger.debug(`Renamed to ${parsed.newName}${isReasoningModel ? ' (with reasoning)' : ''}`);
            return parsed.newName;
          } else {
            SecureLogger.error("Unexpected response type from Anthropic", { type: result.type });
            return name;
          }
        } catch (error) {
          SecureLogger.error("Failed to rename variable with Anthropic", { 
            error: (error as Error).message,
            variableName: name,
            modelUsed: actualModelName,
            reasoningEnabled: isReasoningModel
          });
          return name; // Fallback to original name
        }
      },
      showPercentage
    );
  };
} 