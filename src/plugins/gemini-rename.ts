import { visitAllIdentifiers } from "./local-llm-rename/visit-all-identifiers.js";
import { SecureLogger } from "../security/secure-logger.js";
import { parseGeminiResponse } from "../security/secure-json.js";
import { showPercentage } from "../progress.js";
import {
  GoogleGenerativeAI,
  ModelParams,
  SchemaType
} from "@google/generative-ai";

export function geminiRename({
  apiKey,
  model: modelName
}: {
  apiKey: string;
  model: string;
}) {
  const client = new GoogleGenerativeAI(apiKey);

  return async (code: string): Promise<string> => {
    return await visitAllIdentifiers(
      code,
      async (name, surroundingCode) => {
        SecureLogger.debug(`Renaming ${name}`);
        SecureLogger.debug("Context: ", { contextLength: surroundingCode.length });

        try {
          const model = client.getGenerativeModel(
            toRenameParams(name, modelName)
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

function toRenameParams(name: string, model: string): ModelParams {
  return {
    model,
    systemInstruction: `Rename Javascript variables/function \`${name}\` to have descriptive name based on their usage in the code."`,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        nullable: false,
        description: "The new name for the variable/function",
        type: SchemaType.OBJECT,
        properties: {
          newName: {
            type: SchemaType.STRING,
            nullable: false,
            description: `The new name for the variable/function called \`${name}\``
          }
        },
        required: ["newName"]
      }
    }
  };
}
