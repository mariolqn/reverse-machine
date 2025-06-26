import { visitAllIdentifiers } from "./visit-all-identifiers.js";
import { SecureLogger } from "../security/secure-logger.js";
import { parseGeminiResponse } from "../security/secure-json.js";
import { showPercentage } from "../progress.js";

// Type definitions to avoid external dependency issues
interface ModelConfig {
  model: string;
  systemInstruction: string;
  generationConfig: {
    responseMimeType: string;
    responseSchema: {
      nullable: boolean;
      description: string;
      type: string;
      properties: {
        newName: {
          type: string;
          nullable: boolean;
          description: string;
        };
      };
      required: string[];
    };
  };
}

export function geminiRename({
  apiKey,
  model: modelName
}: {
  apiKey: string;
  model: string;
}) {
  return async (code: string): Promise<string> => {
    // Dynamic import to avoid TypeScript declaration issues
    let GoogleGenerativeAI: any;
    try {
      const geminiModule = await import("@google/generative-ai");
      GoogleGenerativeAI = geminiModule.GoogleGenerativeAI;
    } catch (error) {
      SecureLogger.error("Failed to import Google Generative AI module", {
        error
      });
      return code; // Return original code if import fails
    }

    const client = new GoogleGenerativeAI(apiKey);

    return await visitAllIdentifiers(
      code,
      async (name, surroundingCode) => {
        SecureLogger.debug(`Renaming ${name}`);
        SecureLogger.debug("Context: ", {
          contextLength: surroundingCode.length
        });

        try {
          const model = client.getGenerativeModel(
            createModelConfig(name, modelName)
          );

          const result = await model.generateContent(surroundingCode);

          const parsed = parseGeminiResponse(result.response.text());

          SecureLogger.debug(`Renamed to ${parsed.newName}`);
          return parsed.newName;
        } catch (error) {
          SecureLogger.error("Failed to rename variable with Gemini", {
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

function createModelConfig(name: string, model: string): ModelConfig {
  return {
    model,
    systemInstruction: `Rename Javascript variables/function \`${name}\` to have descriptive name based on their usage in the code."`,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        nullable: false,
        description: "The new name for the variable/function",
        type: "object",
        properties: {
          newName: {
            type: "string",
            nullable: false,
            description: `The new name for the variable/function called \`${name}\``
          }
        },
        required: ["newName"]
      }
    }
  };
}
