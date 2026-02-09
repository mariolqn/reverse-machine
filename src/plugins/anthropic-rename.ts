import { visitAllIdentifiers } from "./visit-all-identifiers.js";
import { SecureLogger } from "../security/secure-logger.js";
import {
  parseAnthropicResponse,
  parseModelObject
} from "../security/secure-json.js";
import { progressManager } from "../progress.js";

// Claude 4 optimized configuration for maximum quality
const CLAUDE4_CONFIG = {
  MAX_CONTEXT_TOKENS: 200000, // Claude 4's context window
  OUTPUT_TOKENS: 8192, // Maximum output tokens
  TEMPERATURE: 0.1, // Low temperature for consistency
  VERIFICATION_PASSES: 2, // Multiple verification passes
};

export function anthropicRename({
  apiKey,
  model: modelName,
  useAdvancedAgent = true // Maximum quality is the default for advanced models
}: {
  apiKey: string;
  model: string;
  useAdvancedAgent?: boolean;
}) {
  return async (code: string): Promise<string> => {
    SecureLogger.debug(`Starting processing for ${code.length} characters with model: ${modelName}`);
    
    // Advanced models (Claude 4+, Claude 3.5 Sonnet, Claude 3 Opus) default to maximum quality mode
    const isAdvancedModel = modelName.includes('claude-4') || modelName.includes('claude-3-5-sonnet') || modelName.includes('claude-3-opus');
    const shouldUseAdvanced = isAdvancedModel && useAdvancedAgent && code.length > 50; // Use advanced for non-trivial code
    
    if (shouldUseAdvanced) {
      return await processWithAdvancedAgent(apiKey, modelName, code);
    } else if (isAdvancedModel) {
      return await processWithClaude4(apiKey, modelName, code);
    } else {
      // Fallback to original approach for older/smaller models
      return await processWithLegacyModel(apiKey, modelName, code);
    }
  };
}

async function processWithAdvancedAgent(
  apiKey: string,
  model: string,
  code: string
): Promise<string> {
  SecureLogger.debug("🚀 Using Advanced Multi-Agent Deobfuscation System (Claude)");
  
  try {
    // Dynamic import to avoid TypeScript declaration issues
    let Anthropic: any;
    try {
      const anthropicModule = await import("@anthropic-ai/sdk");
      Anthropic = anthropicModule.default;
    } catch (error) {
      SecureLogger.error("Failed to import Anthropic SDK module", { error });
      throw error;
    }

    const client = new Anthropic({ apiKey });
    
    // Step 1: Semantic Analysis Phase
    progressManager.updateCurrentFileProgress(0.3);
    const semanticAnalysis = await performSemanticAnalysis(client, model, code);
    
    // Step 2: Pattern Recognition Phase
    progressManager.updateCurrentFileProgress(0.4);
    const patternAnalysis = await performPatternRecognition(client, model, code, semanticAnalysis);
    
    // Step 3: Intelligent Variable Naming Phase
    progressManager.updateCurrentFileProgress(0.6);
    const namingResult = await performIntelligentNaming(client, model, code, semanticAnalysis, patternAnalysis);
    
    // Step 4: Code Transformation Phase
    progressManager.updateCurrentFileProgress(0.7);
    const transformedCode = await performCodeTransformation(client, model, code, namingResult);
    
    // Step 5: Quality Assurance and Verification
    progressManager.updateCurrentFileProgress(0.8);
    const finalResult = await performQualityAssurance(client, model, transformedCode, code);
    progressManager.updateCurrentFileProgress(0.9);
    
    // Log comprehensive analysis
    SecureLogger.debug(`🎯 Advanced Analysis Complete:`);
    SecureLogger.debug(`   • Confidence: ${(namingResult.confidence * 100).toFixed(1)}%`);
    SecureLogger.debug(`   • Variables Mapped: ${namingResult.mappings?.length || 0}`);
    SecureLogger.debug(`   • Quality Score: ${finalResult.qualityScore}/10`);
    
    // Log variable mappings for debugging
    if (namingResult.mappings) {
      namingResult.mappings.forEach((mapping: any) => {
        SecureLogger.debug(`   • ${mapping.original} → ${mapping.renamed} (${(mapping.confidence * 100).toFixed(1)}%)`);
      });
    }
    
    if (finalResult.improvements && finalResult.improvements.length > 0) {
      SecureLogger.debug(`🔧 Improvement Suggestions:`);
      finalResult.improvements.forEach((improvement: string) => {
        SecureLogger.debug(`   • ${improvement}`);
      });
    }
    
    return finalResult.finalCode;
    
  } catch (error) {
    SecureLogger.debug(`❌ Advanced agent failed: ${error}, falling back to standard Claude 4`);
    return await processWithClaude4(apiKey, model, code);
  }
}

async function processWithClaude4(
  apiKey: string,
  model: string,
  code: string
): Promise<string> {
  SecureLogger.debug("Using Claude 4 optimized full-context processing");
  
  try {
    // Dynamic import to avoid TypeScript declaration issues
    let Anthropic: any;
    try {
      const anthropicModule = await import("@anthropic-ai/sdk");
      Anthropic = anthropicModule.default;
    } catch (error) {
      SecureLogger.error("Failed to import Anthropic SDK module", { error });
      throw error;
    }

    const client = new Anthropic({ apiKey });
    
    // Step 1: Main deobfuscation with reasoning
    progressManager.updateCurrentFileProgress(0.3);
    const deobfuscatedResult = await performDeobfuscation(client, model, code);
    
    // Step 2: Self-verification pass
    progressManager.updateCurrentFileProgress(0.6);
    const verifiedResult = await performVerification(client, model, code, deobfuscatedResult);
    
    // Step 3: Final quality check
    progressManager.updateCurrentFileProgress(0.8);
    const finalResult = await performQualityCheck(client, model, verifiedResult);
    progressManager.updateCurrentFileProgress(0.9);
    
    SecureLogger.debug("Claude 4 processing completed successfully");
    return finalResult;
    
  } catch (error) {
    SecureLogger.debug(`Claude 4 processing failed: ${error}, falling back to legacy mode`);
    return await processWithLegacyModel(apiKey, model, code);
  }
}

async function performSemanticAnalysis(client: any, model: string, code: string): Promise<any> {
  SecureLogger.debug("🧠 Phase 1: Semantic Analysis Agent");
  
  const isReasoningModel = model.includes("reasoning");
  const actualModelName = isReasoningModel ? model.replace("-reasoning", "") : model;
  
  const requestBody: Record<string, any> = {
    model: actualModelName,
    max_tokens: CLAUDE4_CONFIG.OUTPUT_TOKENS,
    temperature: CLAUDE4_CONFIG.TEMPERATURE,
    system: createSemanticAnalysisPrompt(),
    messages: [
      {
        role: "user",
        content: `Analyze this JavaScript code for semantic understanding:\n\n${code}\n\nProvide JSON analysis with the following structure:
{
  "description": "Clear description of what the code does",
  "algorithm": "Primary algorithm type",
  "dataFlow": "How data moves through the function",
  "variables": [{"name": "var", "purpose": "detailed purpose", "type": "inferred type"}],
  "confidence": 0.95
}`
      }
    ]
  };

  // Add reasoning-specific parameters for Claude 4 models
  if (isReasoningModel && (actualModelName.includes("claude-4-opus") || actualModelName.includes("claude-4-sonnet"))) {
    requestBody.anthropic_beta = "thinking-2024-12-04";
    requestBody.thinking = true;
  }

  const response = await client.messages.create(requestBody);
  
  let responseText = response.content[0].text;
  
  // For reasoning models, extract the final answer from thinking tags if present
  if (isReasoningModel && responseText.includes("<thinking>")) {
    const thinkingMatch = responseText.match(/<\/thinking>([\s\S]*?)$/);
    if (thinkingMatch) {
      responseText = thinkingMatch[1].trim();
    }
  }
  
  const result = parseModelObject(
    responseText,
    "Anthropic semantic analysis response"
  ) as any;
  SecureLogger.debug(`🧠 Semantic Analysis: ${result.description}`);
  return result;
}

async function performPatternRecognition(client: any, model: string, code: string, semanticAnalysis: any): Promise<any> {
  SecureLogger.debug("🔍 Phase 2: Pattern Recognition Agent");
  
  const isReasoningModel = model.includes("reasoning");
  const actualModelName = isReasoningModel ? model.replace("-reasoning", "") : model;
  
  const requestBody: Record<string, any> = {
    model: actualModelName,
    max_tokens: CLAUDE4_CONFIG.OUTPUT_TOKENS,
    temperature: CLAUDE4_CONFIG.TEMPERATURE,
    system: createPatternRecognitionPrompt(),
    messages: [
      {
        role: "user",
        content: `Identify patterns in this code:\n\n${code}\n\nSemantic context: ${JSON.stringify(semanticAnalysis)}\n\nProvide JSON analysis with pattern details.`
      }
    ]
  };

  if (isReasoningModel && (actualModelName.includes("claude-4-opus") || actualModelName.includes("claude-4-sonnet"))) {
    requestBody.anthropic_beta = "thinking-2024-12-04";
    requestBody.thinking = true;
  }

  const response = await client.messages.create(requestBody);
  
  let responseText = response.content[0].text;
  if (isReasoningModel && responseText.includes("<thinking>")) {
    const thinkingMatch = responseText.match(/<\/thinking>([\s\S]*?)$/);
    if (thinkingMatch) {
      responseText = thinkingMatch[1].trim();
    }
  }
  
  const result = parseModelObject(
    responseText,
    "Anthropic pattern recognition response"
  ) as any;
  SecureLogger.debug(`🔍 Pattern Recognition: Found ${result.patterns?.length || 0} patterns`);
  return result;
}

async function performIntelligentNaming(client: any, model: string, code: string, semanticAnalysis: any, patternAnalysis: any): Promise<any> {
  SecureLogger.debug("🏷️ Phase 3: Intelligent Naming Agent");
  
  const isReasoningModel = model.includes("reasoning");
  const actualModelName = isReasoningModel ? model.replace("-reasoning", "") : model;
  
  const requestBody: Record<string, any> = {
    model: actualModelName,
    max_tokens: CLAUDE4_CONFIG.OUTPUT_TOKENS,
    temperature: CLAUDE4_CONFIG.TEMPERATURE,
    system: createIntelligentNamingPrompt(),
    messages: [
      {
        role: "user",
        content: createNamingPrompt(code, semanticAnalysis, patternAnalysis)
      }
    ]
  };

  if (isReasoningModel && (actualModelName.includes("claude-4-opus") || actualModelName.includes("claude-4-sonnet"))) {
    requestBody.anthropic_beta = "thinking-2024-12-04";
    requestBody.thinking = true;
  }

  const response = await client.messages.create(requestBody);
  
  let responseText = response.content[0].text;
  if (isReasoningModel && responseText.includes("<thinking>")) {
    const thinkingMatch = responseText.match(/<\/thinking>([\s\S]*?)$/);
    if (thinkingMatch) {
      responseText = thinkingMatch[1].trim();
    }
  }
  
  const result = parseModelObject(
    responseText,
    "Anthropic intelligent naming response"
  ) as any;
  SecureLogger.debug(`🏷️ Generated ${result.mappings?.length || 0} variable mappings`);
  return result;
}

async function performCodeTransformation(client: any, model: string, code: string, namingResult: any): Promise<string> {
  SecureLogger.debug("🔄 Phase 4: Code Transformation Agent");
  
  const isReasoningModel = model.includes("reasoning");
  const actualModelName = isReasoningModel ? model.replace("-reasoning", "") : model;
  
  const requestBody: Record<string, any> = {
    model: actualModelName,
    max_tokens: CLAUDE4_CONFIG.OUTPUT_TOKENS,
    temperature: CLAUDE4_CONFIG.TEMPERATURE,
    system: createTransformationPrompt(),
    messages: [
      {
        role: "user",
        content: createTransformationRequest(code, namingResult)
      }
    ]
  };

  if (isReasoningModel && (actualModelName.includes("claude-4-opus") || actualModelName.includes("claude-4-sonnet"))) {
    requestBody.anthropic_beta = "thinking-2024-12-04";
    requestBody.thinking = true;
  }

  const response = await client.messages.create(requestBody);
  
  let responseText = response.content[0].text;
  if (isReasoningModel && responseText.includes("<thinking>")) {
    const thinkingMatch = responseText.match(/<\/thinking>([\s\S]*?)$/);
    if (thinkingMatch) {
      responseText = thinkingMatch[1].trim();
    }
  }
  
  const result = parseModelObject(
    responseText,
    "Anthropic transformation response"
  ) as any;
  SecureLogger.debug("🔄 Code transformation completed");
  return result.transformedCode || code;
}

async function performQualityAssurance(client: any, model: string, transformedCode: string, originalCode: string): Promise<any> {
  SecureLogger.debug("✅ Phase 5: Quality Assurance Agent");
  
  const isReasoningModel = model.includes("reasoning");
  const actualModelName = isReasoningModel ? model.replace("-reasoning", "") : model;
  
  const requestBody: Record<string, any> = {
    model: actualModelName,
    max_tokens: CLAUDE4_CONFIG.OUTPUT_TOKENS,
    temperature: CLAUDE4_CONFIG.TEMPERATURE,
    system: createQualityAssurancePrompt(),
    messages: [
      {
        role: "user",
        content: createQualityAssuranceRequest(transformedCode, originalCode)
      }
    ]
  };

  if (isReasoningModel && (actualModelName.includes("claude-4-opus") || actualModelName.includes("claude-4-sonnet"))) {
    requestBody.anthropic_beta = "thinking-2024-12-04";
    requestBody.thinking = true;
  }

  const response = await client.messages.create(requestBody);
  
  let responseText = response.content[0].text;
  if (isReasoningModel && responseText.includes("<thinking>")) {
    const thinkingMatch = responseText.match(/<\/thinking>([\s\S]*?)$/);
    if (thinkingMatch) {
      responseText = thinkingMatch[1].trim();
    }
  }
  
  const result = parseModelObject(
    responseText,
    "Anthropic quality assurance response"
  ) as any;
  SecureLogger.debug(`✅ Quality Score: ${result.qualityScore}`);
  return { ...result, finalCode: result.finalCode || transformedCode };
}

async function performDeobfuscation(client: any, model: string, code: string): Promise<string> {
  const isReasoningModel = model.includes("reasoning");
  const actualModelName = isReasoningModel ? model.replace("-reasoning", "") : model;
  
  const requestBody: Record<string, any> = {
    model: actualModelName,
    max_tokens: CLAUDE4_CONFIG.OUTPUT_TOKENS,
    temperature: CLAUDE4_CONFIG.TEMPERATURE,
    system: createClaude4SystemPrompt(),
    messages: [
      {
        role: "user",
        content: createDeobfuscationPrompt(code)
      }
    ]
  };

  if (isReasoningModel && (actualModelName.includes("claude-4-opus") || actualModelName.includes("claude-4-sonnet"))) {
    requestBody.anthropic_beta = "thinking-2024-12-04";
    requestBody.thinking = true;
  }

  const response = await client.messages.create(requestBody);
  
  let responseText = response.content[0].text;
  if (isReasoningModel && responseText.includes("<thinking>")) {
    const thinkingMatch = responseText.match(/<\/thinking>([\s\S]*?)$/);
    if (thinkingMatch) {
      responseText = thinkingMatch[1].trim();
    }
  }
  
  const result = parseModelObject(
    responseText,
    "Anthropic deobfuscation response"
  ) as any;
  
  // Log the analysis for debugging
  SecureLogger.debug(`Claude 4 Analysis: ${result.analysis}`);
  
  // Log variable mappings
  if (result.variableMappings) {
    result.variableMappings.forEach((mapping: any) => {
      SecureLogger.debug(`Renamed ${mapping.oldName} to ${mapping.newName} (${mapping.purpose})`);
    });
  }
  
  return result.renamedCode;
}

async function performVerification(client: any, model: string, originalCode: string, renamedCode: string): Promise<string> {
  SecureLogger.debug("Performing self-verification pass");
  
  const isReasoningModel = model.includes("reasoning");
  const actualModelName = isReasoningModel ? model.replace("-reasoning", "") : model;
  
  const requestBody: Record<string, any> = {
    model: actualModelName,
    max_tokens: CLAUDE4_CONFIG.OUTPUT_TOKENS,
    temperature: CLAUDE4_CONFIG.TEMPERATURE,
    system: createVerificationSystemPrompt(),
    messages: [
      {
        role: "user",
        content: createVerificationPrompt(originalCode, renamedCode)
      }
    ]
  };

  if (isReasoningModel && (actualModelName.includes("claude-4-opus") || actualModelName.includes("claude-4-sonnet"))) {
    requestBody.anthropic_beta = "thinking-2024-12-04";
    requestBody.thinking = true;
  }

  const response = await client.messages.create(requestBody);
  
  let responseText = response.content[0].text;
  if (isReasoningModel && responseText.includes("<thinking>")) {
    const thinkingMatch = responseText.match(/<\/thinking>([\s\S]*?)$/);
    if (thinkingMatch) {
      responseText = thinkingMatch[1].trim();
    }
  }
  
  const result = parseModelObject(
    responseText,
    "Anthropic verification response"
  ) as any;
  
  SecureLogger.debug(`Verification status: ${result.verificationStatus}`);
  
  if (result.issuesFound && result.issuesFound.length > 0) {
    SecureLogger.debug(`Issues found: ${JSON.stringify(result.issuesFound)}`);
    return result.correctedCode || renamedCode;
  }
  
  return renamedCode;
}

async function performQualityCheck(client: any, model: string, code: string): Promise<string> {
  SecureLogger.debug("Performing final quality check");
  
  const isReasoningModel = model.includes("reasoning");
  const actualModelName = isReasoningModel ? model.replace("-reasoning", "") : model;
  
  const requestBody: Record<string, any> = {
    model: actualModelName,
    max_tokens: CLAUDE4_CONFIG.OUTPUT_TOKENS,
    temperature: CLAUDE4_CONFIG.TEMPERATURE,
    system: "You are a JavaScript expert performing final quality validation. Check for syntax errors, consistency, and readability. Return the code as-is if no issues, or provide corrected version. Respond in JSON format.",
    messages: [
      {
        role: "user",
        content: `Perform final quality check on this code:\n\n${code}\n\nReturn JSON: {"qualityScore": number, "finalCode": "...", "improvements": ["..."]}`
      }
    ]
  };

  if (isReasoningModel && (actualModelName.includes("claude-4-opus") || actualModelName.includes("claude-4-sonnet"))) {
    requestBody.anthropic_beta = "thinking-2024-12-04";
    requestBody.thinking = true;
  }

  const response = await client.messages.create(requestBody);
  
  let responseText = response.content[0].text;
  if (isReasoningModel && responseText.includes("<thinking>")) {
    const thinkingMatch = responseText.match(/<\/thinking>([\s\S]*?)$/);
    if (thinkingMatch) {
      responseText = thinkingMatch[1].trim();
    }
  }

  try {
    const result = parseModelObject(
      responseText,
      "Anthropic quality check response"
    ) as any;
    SecureLogger.debug(`Quality score: ${result.qualityScore}`);
    
    if (result.improvements && result.improvements.length > 0) {
      SecureLogger.debug(`Quality improvements: ${JSON.stringify(result.improvements)}`);
    }
    
    return result.finalCode || code;
  } catch (error) {
    SecureLogger.debug(`Quality check parsing failed: ${error}`);
    return code;
  }
}

// Legacy model processing (fallback for non-advanced models)
async function processWithLegacyModel(
  apiKey: string,
  modelName: string,
  code: string
): Promise<string> {
  SecureLogger.debug("Using legacy model processing");
  
  // Dynamic import to avoid TypeScript declaration issues
  let Anthropic: any;
  try {
    const anthropicModule = await import("@anthropic-ai/sdk");
    Anthropic = anthropicModule.default;
  } catch (error) {
    SecureLogger.error("Failed to import Anthropic SDK module", { error });
    return code; // Return original code if import fails
  }

  const client = new Anthropic({ apiKey });

  // Determine if this is a reasoning model and configure accordingly
  const isReasoningModel = modelName.includes("reasoning");
  const actualModelName = isReasoningModel
    ? modelName.replace("-reasoning", "")
    : modelName;

  return await visitAllIdentifiers(
    code,
    async (name, surroundingCode) => {
      SecureLogger.debug(
        `Renaming ${name} with model: ${actualModelName}${isReasoningModel ? " (reasoning)" : ""}`
      );
      SecureLogger.debug("Context: ", {
        contextLength: surroundingCode.length
      });

      try {
        const requestBody: Record<string, any> = {
          model: actualModelName,
          max_tokens: isReasoningModel ? 1000 : 150, // More tokens for reasoning models
          system: `You are a code assistant that renames JavaScript variables and functions. Rename the variable/function "${name}" to have a descriptive name based on its usage in the provided code. ${isReasoningModel ? "Think through your reasoning step by step before providing the answer." : ""} Respond with a JSON object in the format: {"newName": "descriptiveName"}`,
          messages: [
            {
              role: "user",
              content: `Please analyze this JavaScript code and suggest a descriptive name for the variable/function "${name}" based on its usage:\n\n${surroundingCode}`
            }
          ]
        };

        // Add reasoning-specific parameters for Claude 4 models
        if (
          isReasoningModel &&
          (actualModelName.includes("claude-4-opus") ||
            actualModelName.includes("claude-4-sonnet"))
        ) {
          // Enable extended thinking for Claude 4 reasoning models
          requestBody.anthropic_beta = "thinking-2024-12-04";
          requestBody.thinking = true;
        }

        const response = await client.messages.create(requestBody);

        const result = response.content[0];
        if (result.type === "text") {
          let responseText = result.text;

          // For reasoning models, extract the final answer from thinking tags if present
          if (isReasoningModel && responseText.includes("<thinking>")) {
            const thinkingMatch = responseText.match(
              /<\/thinking>([\s\S]*?)$/
            );
            if (thinkingMatch) {
              responseText = thinkingMatch[1].trim();
              SecureLogger.debug("Extracted answer from reasoning response");
            }
          }

          const parsed = parseAnthropicResponse(responseText);
          SecureLogger.debug(
            `Renamed to ${parsed.newName}${isReasoningModel ? " (with reasoning)" : ""}`
          );
          return parsed.newName;
        } else {
          SecureLogger.error("Unexpected response type from Anthropic", {
            type: result.type
          });
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
}

// System prompts for different phases
function createSemanticAnalysisPrompt(): string {
  return `You are a JavaScript semantic analysis specialist. Your task is to understand the deep meaning and purpose of code.

EXPERTISE AREAS:
- Algorithm identification and classification
- Data flow analysis
- Functional programming patterns
- Control flow understanding
- Variable lifecycle analysis

ANALYSIS REQUIREMENTS:
1. Identify the primary algorithm or pattern
2. Understand data transformations
3. Map variable purposes and relationships
4. Detect functional programming concepts
5. Assess computational complexity

OUTPUT FORMAT:
{
  "description": "Clear description of what the code does",
  "algorithm": "Primary algorithm type (e.g., 'string chunking', 'array transformation')",
  "dataFlow": "How data moves through the function",
  "variables": [
    {"name": "var", "purpose": "detailed purpose", "type": "inferred type", "lifecycle": "scope and usage"}
  ],
  "complexity": "time/space complexity",
  "confidence": 0.95
}

FOCUS: Deep semantic understanding over surface-level analysis.`;
}

function createPatternRecognitionPrompt(): string {
  return `You are a JavaScript pattern recognition specialist with deep knowledge of common coding patterns and minification techniques.

PATTERN DETECTION FOCUS:
- Loop patterns and iterations
- Array/object manipulation
- Function composition patterns
- Callback and closure usage
- Data structure operations

ANALYSIS DEPTH:
1. Identify structural patterns
2. Map to common algorithms
3. Detect minification signatures
4. Understand variable relationships
5. Recognize functional patterns

OUTPUT FORMAT:
{
  "patterns": [
    {"type": "pattern_type", "confidence": 0.9, "variables": ["a", "b"], "description": "what it does"}
  ],
  "minificationIndicators": ["single letter vars", "compressed syntax"],
  "structuralAnalysis": "overall code structure assessment"
}`;
}

function createIntelligentNamingPrompt(): string {
  return `You are an elite variable naming specialist with expertise in creating semantically perfect, readable variable names.

NAMING EXCELLENCE STANDARDS:
1. **Semantic Precision**: Names must perfectly capture the variable's purpose
2. **Contextual Awareness**: Consider the broader function context
3. **Consistency**: Related variables follow consistent naming patterns
4. **Readability**: Names should be immediately understandable
5. **Convention Adherence**: Follow JavaScript best practices

NAMING CONVENTIONS:
- Functions: camelCase, verbNoun pattern, describe action clearly
- Variables: camelCase, descriptive nouns, avoid abbreviations
- Parameters: descriptive of purpose, match function intent

SEMANTIC HINTS:
- Loops: index, currentIndex, iterator, position
- Arrays: list, collection, items, results, output
- Strings: text, input, content, message
- Numbers: count, length, size, index, value
- Objects: data, config, options, properties

OUTPUT FORMAT:
{
  "mappings": [
    {
      "original": "a",
      "renamed": "splitStringIntoChunks",
      "confidence": 0.95,
      "reasoning": "Function splits string into array of substring chunks",
      "category": "function"
    }
  ],
  "namingStrategy": "overall approach description",
  "consistency": "how naming maintains consistency"
}`;
}

function createTransformationPrompt(): string {
  return `You are a code transformation specialist. Apply variable renamings with surgical precision while maintaining perfect syntax and functionality.

TRANSFORMATION REQUIREMENTS:
1. **Perfect Consistency**: Every instance of a variable gets renamed
2. **Syntax Preservation**: Maintain exact JavaScript syntax
3. **Scope Awareness**: Respect variable scope boundaries
4. **String Safety**: Don't rename variables inside string literals
5. **Property Safety**: Don't rename object property accesses incorrectly

PRECISION STANDARDS:
- Use word boundary matching
- Preserve formatting and style
- Maintain comment integrity
- Ensure no partial replacements

OUTPUT FORMAT:
{
  "transformedCode": "complete transformed JavaScript code",
  "transformationLog": ["detailed log of each replacement"],
  "verificationChecks": ["syntax valid", "all variables renamed", "no regressions"]
}`;
}

function createQualityAssurancePrompt(): string {
  return `You are a quality assurance specialist for JavaScript code transformation. Evaluate code quality across multiple dimensions.

QUALITY ASSESSMENT CRITERIA:
1. **Syntax Validity**: Perfect JavaScript syntax
2. **Semantic Accuracy**: Variable names match their purpose
3. **Consistency**: Same variables have same names throughout
4. **Readability**: Code is easily understandable
5. **Completeness**: All minified variables are renamed

SCORING SYSTEM (0-10):
- Syntax: Parse-able, valid JavaScript
- Semantics: Names accurately reflect purpose
- Consistency: No variable naming conflicts
- Readability: Professional, clear code
- Completeness: No minified variables remain

OUTPUT FORMAT:
{
  "syntaxScore": 9.5,
  "semanticScore": 8.8,
  "consistencyScore": 9.2,
  "readabilityScore": 9.0,
  "qualityScore": 9.1,
  "needsCorrection": false,
  "issues": ["specific issues if any"],
  "improvements": ["improvement recommendations"],
  "finalCode": "final processed code"
}`;
}

function createClaude4SystemPrompt(): string {
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

// Helper methods for creating specialized requests
function createNamingPrompt(code: string, semanticAnalysis: any, patternAnalysis: any): string {
  return `Create optimal variable names for this code:

CODE:
${code}

SEMANTIC CONTEXT:
${JSON.stringify(semanticAnalysis, null, 2)}

PATTERN CONTEXT:
${JSON.stringify(patternAnalysis, null, 2)}

NAMING TASK:
Generate the most semantically accurate, professional variable names that:
1. Perfectly capture each variable's purpose
2. Follow JavaScript naming conventions
3. Maintain consistency across the codebase
4. Are immediately readable and understandable

Provide comprehensive JSON mapping with high confidence scores.`;
}

function createTransformationRequest(code: string, namingResult: any): string {
  return `Transform this code by applying the variable renamings and provide JSON response:

ORIGINAL CODE:
${code}

VARIABLE MAPPINGS:
${JSON.stringify(namingResult.mappings, null, 2)}

TRANSFORMATION REQUIREMENTS:
- Replace ALL instances of each original variable name
- Maintain perfect JavaScript syntax
- Preserve code formatting and style
- Ensure 100% consistency in renaming
- Verify no minified variable names remain

Provide the complete transformed code with verification log in JSON format.`;
}

function createQualityAssuranceRequest(transformedCode: string, originalCode: string): string {
  return `Perform comprehensive quality assurance on this transformed code:

TRANSFORMED CODE:
${transformedCode}

ORIGINAL CODE (for reference):
${originalCode}

QUALITY ASSESSMENT AREAS:
1. Syntax validation and parsing
2. Semantic accuracy of variable names
3. Consistency of naming throughout
4. Overall readability and professionalism
5. Completeness of transformation

Provide detailed scoring and identify any issues requiring correction.`;
}
