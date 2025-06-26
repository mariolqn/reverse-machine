import OpenAI from "openai";
import { showPercentage } from "../../progress.js";
import { SecureLogger } from "../../security/secure-logger.js";
import { AdvancedDeobfuscationAgent } from "./advanced-deobfuscation-agent.js";

// GPT-4.1 optimized configuration for maximum quality
const GPT41_CONFIG = {
  MAX_CONTEXT_TOKENS: 1000000, // Full 1M context window
  OUTPUT_TOKENS: 32000, // Maximum output tokens
  TEMPERATURE: 0.1, // Low temperature for consistency
  VERIFICATION_PASSES: 2, // Multiple verification passes
};

export function openaiRename({
  apiKey,
  model,
  useAdvancedAgent = true // Maximum quality is the default for advanced models
}: {
  apiKey: string;
  model: string;
  useAdvancedAgent?: boolean;
}) {
  const client = new OpenAI({ apiKey });

  return async (code: string): Promise<string> => {
    SecureLogger.debug(`Starting processing for ${code.length} characters with model: ${model}`);
    
    // Advanced models (GPT-4.1+, O-series) default to maximum quality mode
    const isAdvancedModel = model.includes('gpt-4.1') || model.includes('o1') || model.includes('o3');
    const shouldUseAdvanced = isAdvancedModel && useAdvancedAgent && code.length > 50; // Use advanced for non-trivial code
    
    if (shouldUseAdvanced) {
      return await processWithAdvancedAgent(apiKey, model, code);
    } else if (isAdvancedModel) {
      return await processWithGPT41(client, model, code);
    } else {
      // Fallback to original approach for older models
      return await processWithLegacyModel(client, model, code);
    }
  };
}

async function processWithAdvancedAgent(
  apiKey: string,
  model: string,
  code: string
): Promise<string> {
  SecureLogger.debug("🚀 Using Advanced Multi-Agent Deobfuscation System");
  
  try {
    const agent = new AdvancedDeobfuscationAgent(apiKey, model);
    const result = await agent.deobfuscate(code);
    
    // Log comprehensive analysis
    SecureLogger.debug(`🎯 Advanced Analysis Complete:`);
    SecureLogger.debug(`   • Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    SecureLogger.debug(`   • Syntax Score: ${result.analysis.syntaxScore}/10`);
    SecureLogger.debug(`   • Semantic Score: ${result.analysis.semanticScore}/10`);
    SecureLogger.debug(`   • Consistency Score: ${result.analysis.consistencyScore}/10`);
    SecureLogger.debug(`   • Readability Score: ${result.analysis.readabilityScore}/10`);
    SecureLogger.debug(`   • Processing Time: ${result.processingTime}ms`);
    SecureLogger.debug(`   • Variables Mapped: ${result.variableMappings.length}`);
    
    // Log variable mappings for debugging
    result.variableMappings.forEach(mapping => {
      SecureLogger.debug(`   • ${mapping.original} → ${mapping.renamed} (${(mapping.confidence * 100).toFixed(1)}%)`);
    });
    
    if (result.improvements.length > 0) {
      SecureLogger.debug(`🔧 Improvement Suggestions:`);
      result.improvements.forEach(improvement => {
        SecureLogger.debug(`   • ${improvement}`);
      });
    }
    
    return result.deobfuscatedCode;
    
  } catch (error) {
    SecureLogger.debug(`❌ Advanced agent failed: ${error}, falling back to standard GPT-4.1`);
    const client = new OpenAI({ apiKey });
    return await processWithGPT41(client, model, code);
  }
}

async function processWithGPT41(
  client: OpenAI, 
  model: string, 
  code: string
): Promise<string> {
  SecureLogger.debug("Using GPT-4.1 optimized full-context processing");
  
  try {
    // Step 1: Main deobfuscation with chain-of-thought
    const deobfuscatedResult = await performDeobfuscation(client, model, code);
    
    // Step 2: Self-verification pass
    const verifiedResult = await performVerification(client, model, code, deobfuscatedResult);
    
    // Step 3: Final quality check
    const finalResult = await performQualityCheck(client, model, verifiedResult);
    
    SecureLogger.debug("GPT-4.1 processing completed successfully");
    return finalResult;
    
  } catch (error) {
    SecureLogger.debug(`GPT-4.1 processing failed: ${error}, falling back to legacy mode`);
    return await processWithLegacyModel(client, model, code);
  }
}

async function performDeobfuscation(
  client: OpenAI,
  model: string, 
  code: string
): Promise<string> {
  const response = await client.chat.completions.create({
    model,
    temperature: GPT41_CONFIG.TEMPERATURE,
    max_tokens: GPT41_CONFIG.OUTPUT_TOKENS,
    messages: [
      {
        role: "system",
        content: createGPT41SystemPrompt()
      },
      {
        role: "user", 
        content: createDeobfuscationPrompt(code)
      }
    ],
    response_format: { type: "json_object" }
  });

  const result = response.choices[0].message?.content;
  if (!result) {
    throw new Error("Empty response from GPT-4.1");
  }

  const parsedResult = JSON.parse(result);
  
  // Log the analysis for debugging
  SecureLogger.debug(`GPT-4.1 Analysis: ${parsedResult.analysis}`);
  
  // Log variable mappings
  if (parsedResult.variableMappings) {
    parsedResult.variableMappings.forEach((mapping: any) => {
      SecureLogger.debug(`Renamed ${mapping.oldName} to ${mapping.newName} (${mapping.purpose})`);
    });
  }
  
  return parsedResult.renamedCode;
}

async function performVerification(
  client: OpenAI,
  model: string,
  originalCode: string,
  renamedCode: string
): Promise<string> {
  SecureLogger.debug("Performing self-verification pass");
  
  const response = await client.chat.completions.create({
    model,
    temperature: GPT41_CONFIG.TEMPERATURE,
    max_tokens: GPT41_CONFIG.OUTPUT_TOKENS,
    messages: [
      {
        role: "system",
        content: createVerificationSystemPrompt()
      },
      {
        role: "user",
        content: createVerificationPrompt(originalCode, renamedCode)
      }
    ],
    response_format: { type: "json_object" }
  });

  const result = response.choices[0].message?.content;
  if (!result) {
    throw new Error("Empty verification response");
  }

  const parsedResult = JSON.parse(result);
  
  SecureLogger.debug(`Verification status: ${parsedResult.verificationStatus}`);
  
  if (parsedResult.issuesFound && parsedResult.issuesFound.length > 0) {
    SecureLogger.debug(`Issues found: ${JSON.stringify(parsedResult.issuesFound)}`);
    return parsedResult.correctedCode || renamedCode;
  }
  
  return renamedCode;
}

async function performQualityCheck(
  client: OpenAI,
  model: string,
  code: string
): Promise<string> {
  SecureLogger.debug("Performing final quality check");
  
  const response = await client.chat.completions.create({
    model,
    temperature: GPT41_CONFIG.TEMPERATURE,
    max_tokens: GPT41_CONFIG.OUTPUT_TOKENS,
    messages: [
      {
        role: "system",
        content: "You are a JavaScript expert performing final quality validation. Check for syntax errors, consistency, and readability. Return the code as-is if no issues, or provide corrected version. Respond in JSON format."
      },
      {
        role: "user",
        content: `Perform final quality check on this code:\n\n${code}\n\nReturn JSON: {"qualityScore": number, "finalCode": "...", "improvements": ["..."]}`
      }
    ],
    response_format: { type: "json_object" }
  });

  const result = response.choices[0].message?.content;
  if (!result) {
    return code; // Return original if quality check fails
  }

  try {
    const parsedResult = JSON.parse(result);
    SecureLogger.debug(`Quality score: ${parsedResult.qualityScore}`);
    
    if (parsedResult.improvements && parsedResult.improvements.length > 0) {
      SecureLogger.debug(`Quality improvements: ${JSON.stringify(parsedResult.improvements)}`);
    }
    
    return parsedResult.finalCode || code;
  } catch (error) {
    SecureLogger.debug(`Quality check parsing failed: ${error}`);
    return code;
  }
}

function createGPT41SystemPrompt(): string {
  return `You are an expert JavaScript deobfuscation agent powered by advanced reasoning capabilities.

MISSION: Transform minified/obfuscated JavaScript into clean, readable code with meaningful variable names.

CRITICAL REQUIREMENTS FOR EXCELLENCE:
1. ANALYZE the complete code structure before making any changes
2. UNDERSTAND the semantic purpose of every variable and function
3. CREATE descriptive, meaningful names that reflect actual usage
4. ENSURE 100% consistency - every instance of a variable must be renamed
5. VERIFY that no original minified names remain in the output
6. MAINTAIN perfect JavaScript syntax and functionality

STEP-BY-STEP PROCESS (Chain-of-Thought):
1. **ANALYSIS PHASE**: Read and understand what the code does
2. **MAPPING PHASE**: Create semantic mappings for all identifiers
3. **TRANSFORMATION PHASE**: Apply renamings consistently throughout
4. **VERIFICATION PHASE**: Confirm no minified names remain
5. **VALIDATION PHASE**: Ensure syntax and logic correctness

QUALITY STANDARDS:
- Variable names should be descriptive and follow camelCase convention
- Function names should clearly indicate their purpose/action
- Parameter names should reflect their role in the function
- Loop variables should have meaningful names (not just i, j, k)
- Consistency is CRITICAL - same variable = same name throughout

OUTPUT FORMAT:
Respond with a JSON object containing:
{
  "analysis": "description of what the code does",
  "variableMappings": [
    {"oldName": "a", "newName": "calculateSum", "purpose": "function that calculates sum"},
    {"oldName": "e", "newName": "inputArray", "purpose": "input parameter array"}
  ],
  "renamedCode": "complete JavaScript code with ALL variables renamed",
  "confidence": "high/medium/low based on naming certainty",
  "syntaxValid": true/false
}

REMEMBER: You have access to the FULL context. Use it to make the BEST possible variable names based on complete understanding.`;
}

function createDeobfuscationPrompt(code: string): string {
  return `Please deobfuscate this JavaScript code using your advanced reasoning capabilities:

ORIGINAL MINIFIED CODE:
\`\`\`javascript
${code}
\`\`\`

INSTRUCTIONS:
1. First, analyze what this code does step by step
2. Identify each variable's semantic purpose based on its usage
3. Create meaningful, descriptive names for ALL variables and functions
4. Apply the renamings consistently throughout the ENTIRE code
5. Verify that NO original minified variable names remain
6. Ensure the code remains syntactically correct and functional

Remember: Quality over speed. Take time to create the best possible variable names based on the code's actual functionality.`;
}

function createVerificationSystemPrompt(): string {
  return `You are a code verification specialist using advanced reasoning to ensure deobfuscation quality.

VERIFICATION MISSION:
1. Check if ALL minified variable names have been replaced
2. Verify consistent naming throughout the code
3. Ensure syntactic correctness
4. Validate that variable names are meaningful and appropriate
5. Identify any remaining issues and provide corrections

VERIFICATION CHECKLIST:
□ No single-letter variables remain (except standard loop variables if appropriate)
□ All variable names are descriptive and meaningful
□ Same variable has same name throughout the code
□ Function names clearly describe their purpose
□ Code is syntactically valid JavaScript
□ Naming follows camelCase convention

OUTPUT FORMAT:
{
  "verificationStatus": "passed/failed/needs_correction",
  "issuesFound": ["list of specific issues"],
  "consistencyScore": number (0-1),
  "readabilityScore": number (0-1),
  "correctedCode": "improved code if issues found",
  "recommendations": ["suggestions for improvement"]
}`;
}

function createVerificationPrompt(originalCode: string, renamedCode: string): string {
  return `Please verify the quality of this deobfuscation and respond with JSON format:

ORIGINAL MINIFIED CODE:
\`\`\`javascript
${originalCode}
\`\`\`

RENAMED CODE TO VERIFY:
\`\`\`javascript
${renamedCode}
\`\`\`

VERIFICATION TASKS:
1. Check if ALL minified variable names from the original have been replaced
2. Verify naming consistency throughout the code
3. Assess if variable names are meaningful and appropriate
4. Ensure syntactic correctness
5. Provide corrections if any issues are found

Focus on: completeness, consistency, meaningfulness, and correctness.

Please respond with JSON format containing your verification results.`;
}

// Legacy model processing (fallback for non-GPT-4.1 models)
async function processWithLegacyModel(
  client: OpenAI,
  model: string,
  code: string
): Promise<string> {
  SecureLogger.debug("Using legacy model processing");
  
  // Original batched approach for older models
  const identifiers = extractIdentifiers(code);
  const batches = createBatches(identifiers, 10);
  const cache = new Map<string, string>();
  const usedNames = new Set<string>();

  for (const batch of batches) {
    await processBatch(client, model, batch, code, cache, usedNames);
  }

  return applyRenames(code, cache);
}

function extractIdentifiers(code: string): string[] {
  // Simple regex-based identifier extraction for legacy mode
  const identifierRegex = /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g;
  const matches = code.match(identifierRegex) || [];
  return [...new Set(matches)].filter(id => 
    id.length <= 3 && // Likely minified
    !['var', 'let', 'const', 'function', 'return', 'if', 'else', 'for', 'while'].includes(id)
  );
}

function createBatches<T>(array: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    batches.push(array.slice(i, i + size));
  }
  return batches;
}

async function processBatch(
  client: OpenAI,
  model: string,
  batch: string[],
  code: string,
  cache: Map<string, string>,
  usedNames: Set<string>
): Promise<void> {
  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: 'You are a code assistant that renames JavaScript variables and functions. Provide descriptive names based on their usage in the code. Respond with a JSON object containing an array of renamed variables in the format: {"renamedVariables": [{"oldName": "originalName", "newName": "newName"}, ...]}'
        },
        {
          role: "user",
          content: JSON.stringify(batch.map(name => ({
            name,
            context: getContext(code, name, 4000)
          })))
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = response.choices[0].message?.content;
    if (!result) return;

    const parsedResult = JSON.parse(result);
    
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
    SecureLogger.debug(`Error processing batch: ${error}`);
    batch.forEach(name => cache.set(name, name));
  }
}

function getContext(code: string, name: string, windowSize: number): string {
  const index = code.indexOf(name);
  if (index === -1) return "";
  const start = Math.max(0, index - windowSize / 2);
  const end = Math.min(code.length, index + windowSize / 2);
  return code.slice(start, end);
}

function applyRenames(code: string, cache: Map<string, string>): string {
  let renamedCode = code;
  for (const [oldName, newName] of cache.entries()) {
    renamedCode = safeReplace(renamedCode, oldName, newName);
  }
  return renamedCode;
}

function safeReplace(code: string, oldName: string, newName: string): string {
  const regex = new RegExp(`\\b${escapeRegExp(oldName)}\\b`, "g");
  return code.replace(regex, (match, offset) => {
    const prevChar = code[offset - 1];
    const nextChar = code[offset + match.length];
    if (
      prevChar === '"' ||
      prevChar === "'" ||
      prevChar === "/" ||
      nextChar === "." ||
      (prevChar && /\w/.test(prevChar)) ||
      (nextChar && /\w/.test(nextChar)) ||
      match === "in" ||
      match === "of" ||
      isInsideStringLiteral(code, offset)
    ) {
      return match;
    }
    return newName;
  });
}

function isInsideStringLiteral(code: string, offset: number): boolean {
  let inString = false;
  let stringChar = "";
  for (let i = 0; i < offset; i++) {
    if ((code[i] === '"' || code[i] === "'") && code[i - 1] !== "\\") {
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

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
