import OpenAI from "openai";
import { visitAllIdentifiers } from "../local-llm-rename/visit-all-identifiers.js";
import { showPercentage } from "../../progress.js";
import { SecureLogger } from "../security/secure-logger.js";

const CONTEXT_WINDOW_SIZE = 4000; // Increased context window
const BATCH_SIZE = 10; // Number of renames to batch in a single API call

export function openaiRename({
  apiKey,
  model
}: {
  apiKey: string;
  model: string;
}) {
  const client = new OpenAI({ apiKey });
  const cache = new Map<string, string>();
  const usedNames = new Set<string>();

  return async (code: string): Promise<string> => {
    const identifiers = new Set<string>();
    await visitAllIdentifiers(code, (name) => {
      identifiers.add(name);
      return Promise.resolve(name);
    }, showPercentage);

    const batches = [];
    const identifierArray = Array.from(identifiers);
    for (let i = 0; i < identifierArray.length; i += BATCH_SIZE) {
      batches.push(identifierArray.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      const renameBatch = batch.map(name => ({ name, context: getContext(code, name) }));
      await processBatch(renameBatch);
    }

    return applyRenames(code);

    async function processBatch(renameBatch: { name: string; context: string }[]) {
      try {
        const response = await client.chat.completions.create(
          toBatchRenamePrompt(renameBatch, model)
        );
        const result = response.choices[0].message?.content;
        if (!result) {
          throw new Error("Failed to rename batch: Empty response");
        }
        
        let parsedResult;
        try {
          const { parseOpenAIResponse } = await import("../security/secure-json.js");
          parsedResult = parseOpenAIResponse(result);
        } catch (error) {
          console.error("Failed to parse or validate API response:", error);
          throw new Error("Invalid or unsafe JSON response from OpenAI API");
        }

        parsedResult.renamedVariables.forEach((rename: { oldName: string; newName: string }) => {
          if (rename.oldName && rename.newName) {
            let finalNewName = rename.newName;
            let counter = 1;
            while (usedNames.has(finalNewName)) {
              finalNewName = `${rename.newName}_${counter}`;
              counter++;
            }
            usedNames.add(finalNewName);
            cache.set(rename.oldName, finalNewName);
            SecureLogger.debug(`Renamed ${rename.oldName} to ${finalNewName}`);
          }
        });
      } catch (error) {
        console.error("Error processing batch:", error);
        renameBatch.forEach(({ name }) => cache.set(name, name));
      }
    }

    function getContext(code: string, name: string): string {
      const index = code.indexOf(name);
      if (index === -1) return '';
      const start = Math.max(0, index - CONTEXT_WINDOW_SIZE / 2);
      const end = Math.min(code.length, index + CONTEXT_WINDOW_SIZE / 2);
      return code.slice(start, end);
    }

    function applyRenames(code: string): string {
      let renamedCode = code;
      for (const [oldName, newName] of cache.entries()) {
        renamedCode = safeReplace(renamedCode, oldName, newName);
      }
      return renamedCode;
    }
  };
}

// Helper function for safer replacements
function safeReplace(code: string, oldName: string, newName: string): string {
  const regex = new RegExp(`\\b${escapeRegExp(oldName)}\\b`, 'g');
  return code.replace(regex, (match, offset) => {
    // Check if the match is within a string, regex literal, or part of a larger identifier
    const prevChar = code[offset - 1];
    const nextChar = code[offset + match.length];
    if (
      prevChar === '"' || prevChar === "'" || prevChar === '/' ||
      nextChar === '.' || // Don't replace if it's part of a property access
      (prevChar && /\w/.test(prevChar)) || // Don't replace if it's part of a larger identifier
      (nextChar && /\w/.test(nextChar)) ||
      (match === 'in' || match === 'of') || // Don't replace 'in' or 'of' in for loops
      isInsideStringLiteral(code, offset) // Don't replace if it's inside a string literal
    ) {
      return match; // Don't replace if it's part of a string, regex, larger identifier, or loop keyword
    }
    return newName;
  });
}

function isInsideStringLiteral(code: string, offset: number): boolean {
  let inString = false;
  let stringChar = '';
  for (let i = 0; i < offset; i++) {
    if ((code[i] === '"' || code[i] === "'") && code[i - 1] !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = code[i];
      } else if (code[i] === stringChar) {
        inString = false;
      }
    }
  }
  return inString;
}

// Helper function to escape special regex characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toBatchRenamePrompt(
  batch: { name: string; context: string }[],
  model: string
): OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming {
  return {
    model,
    messages: [
      {
        role: "system",
        content: "You are a code assistant that renames JavaScript variables and functions. Provide descriptive names based on their usage in the code. If you can't determine a good name, return the original name. Respond with a JSON object containing an array of renamed variables in the format: {\"renamedVariables\": [{\"oldName\": \"originalName\", \"newName\": \"newName\"}, ...]}"
      },
      {
        role: "user",
        content: JSON.stringify(batch)
      }
    ],
    response_format: { type: "json_object" }
  };
}
