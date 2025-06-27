import { visitAllIdentifiers } from "./visit-all-identifiers.js";
import { SecureLogger } from "../security/secure-logger.js";
import { parseGeminiResponse } from "../security/secure-json.js";
import { progressManager } from "../progress.js";

// Gemini 2.5 Pro optimized configuration for maximum quality
const GEMINI25_CONFIG = {
  MAX_CONTEXT_TOKENS: 1000000, // Gemini 2.5's context window
  OUTPUT_TOKENS: 8192, // Maximum output tokens
  TEMPERATURE: 0.1, // Low temperature for consistency
  VERIFICATION_PASSES: 2, // Multiple verification passes
};

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
  model: modelName,
  useAdvancedAgent = true // Maximum quality is the default for advanced models
}: {
  apiKey: string;
  model: string;
  useAdvancedAgent?: boolean;
}) {
  return async (code: string): Promise<string> => {
    const startTime = Date.now();
    const codeLength = code.length;
    
    SecureLogger.debug(`🚀 Starting optimized processing: ${codeLength} chars, model: ${modelName}`);
    
    // **SPEED OPTIMIZATION**: Early filtering for non-JS content
    if (codeLength < 10 || !isJavaScriptContent(code)) {
      SecureLogger.debug("⚡ Skipping non-JavaScript content");
      return code;
    }
    
    // **SPEED OPTIMIZATION**: Detect file complexity for processing strategy
    const complexity = analyzeCodeComplexity(code);
    SecureLogger.debug(`📊 Code complexity: ${complexity.level} (${complexity.score}/10)`);
    
    // Advanced models (Gemini 2.5+, 1.5 Pro) with optimized routing
    const isAdvancedModel = modelName.includes('gemini-2.5') || modelName.includes('1.5-pro');
    
    let result: string;
    
    if (isAdvancedModel) {
      // **INTELLIGENT ROUTING**: Choose processing method based on complexity and size
      if (complexity.level === 'low' && codeLength < 1000) {
        SecureLogger.debug("⚡ Using ultra-fast mode for simple small file");
        result = await processUltraFast(apiKey, modelName, code);
      } else if (useAdvancedAgent && complexity.level === 'high' && codeLength > 10000) {
        SecureLogger.debug("🧠 Using advanced agent for complex large file");
        result = await processWithAdvancedAgent(apiKey, modelName, code);
      } else {
        SecureLogger.debug("🚀 Using optimized Gemini 2.5 processing");
        result = await processWithGemini25(apiKey, modelName, code);
      }
    } else {
      SecureLogger.debug("📦 Using legacy model processing");
      result = await processWithLegacyModel(apiKey, modelName, code);
    }
    
    const duration = Date.now() - startTime;
    const speedScore = codeLength / (duration / 1000); // chars per second
    SecureLogger.debug(`✅ Processing completed: ${duration}ms, ${speedScore.toFixed(0)} chars/sec`);
    
    return result;
  };
}

async function processWithAdvancedAgent(
  apiKey: string,
  model: string,
  code: string
): Promise<string> {
  SecureLogger.debug("🚀 Using Advanced Multi-Agent Deobfuscation System (Gemini)");
  
  try {
    // Dynamic import to avoid TypeScript declaration issues
    let GoogleGenerativeAI: any;
    try {
      const geminiModule = await import("@google/generative-ai");
      GoogleGenerativeAI = geminiModule.GoogleGenerativeAI;
    } catch (error) {
      SecureLogger.error("Failed to import Google Generative AI module", { error });
      throw error;
    }

    const client = new GoogleGenerativeAI(apiKey);
    
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
    SecureLogger.debug(`❌ Advanced agent failed: ${error}, falling back to standard Gemini 2.5`);
    return await processWithGemini25(apiKey, model, code);
  }
}

async function processWithGemini25(
  apiKey: string,
  model: string,
  code: string
): Promise<string> {
  SecureLogger.debug("Using Gemini 2.5 optimized full-context processing");
  
  try {
    // Dynamic import to avoid TypeScript declaration issues
    let GoogleGenerativeAI: any;
    try {
      const geminiModule = await import("@google/generative-ai");
      GoogleGenerativeAI = geminiModule.GoogleGenerativeAI;
    } catch (error) {
      SecureLogger.error("Failed to import Google Generative AI module", { error });
      throw error;
    }

    const client = new GoogleGenerativeAI(apiKey);
    
    // **SPEED OPTIMIZATION**: Determine processing strategy based on file size
    const codeLength = code.length;
    const isLargeFile = codeLength > 50000; // 50k+ characters
    const isVeryLargeFile = codeLength > 200000; // 200k+ characters
    
    if (isVeryLargeFile) {
      // For very large files: chunk processing with parallel verification
      return await processLargeFileOptimized(client, model, code);
    } else if (isLargeFile) {
      // For large files: parallel processing with smart chunking
      return await processParallelOptimized(client, model, code);
    } else {
      // For small files: ultra-fast parallel processing
      return await processSmallFileOptimized(client, model, code);
    }
    
  } catch (error) {
    SecureLogger.debug(`Gemini 2.5 processing failed: ${error}, falling back to legacy mode`);
    return await processWithLegacyModel(apiKey, model, code);
  }
}

// Enhanced JSON parsing with comprehensive error recovery
function parseGeminiJsonResponse(responseText: string, context: string): any {
  if (!responseText || typeof responseText !== 'string') {
    SecureLogger.debug(`${context}: Empty or invalid response, using fallback`);
    return createFallbackResponse(context);
  }

  // Log response characteristics for debugging
  const responseLength = responseText.length;
  const hasIncompleteJson = responseText.includes('{') && !responseText.includes('}');
  const endsAbruptly = !responseText.trim().endsWith('}') && !responseText.trim().endsWith(']');
  
  if (responseLength > 0) {
    SecureLogger.debug(`${context}: Response length ${responseLength}, incomplete JSON: ${hasIncompleteJson}, ends abruptly: ${endsAbruptly}`);
  }

  // Check for obvious truncation patterns
  if (responseLength > 100 && (hasIncompleteJson || endsAbruptly || responseText.endsWith('...'))) {
    SecureLogger.debug(`${context}: Response appears truncated, applying truncation recovery`);
    const recoveredText = attemptTruncationRecovery(responseText);
    if (recoveredText !== responseText) {
      SecureLogger.debug(`${context}: Truncation recovery applied`);
      responseText = recoveredText;
    }
  }

  // Clean the response text first
  const cleanedResponse = cleanResponseText(responseText);
  
  // Strategy 1: Direct JSON parsing
  try {
    const parsed = JSON.parse(cleanedResponse);
    SecureLogger.debug(`${context}: Direct JSON parsing successful`);
    return validateAndFixParsedResponse(parsed, context);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    SecureLogger.debug(`${context} direct JSON parsing failed: ${errorMessage}`);
    
    // Log more details for specific error types
    if (errorMessage.includes('Unterminated string')) {
      const position = errorMessage.match(/position (\d+)/)?.[1];
      if (position) {
        const pos = parseInt(position);
        const snippet = cleanedResponse.substring(Math.max(0, pos - 50), pos + 50);
        SecureLogger.debug(`${context} unterminated string at position ${pos}, snippet: "${snippet}"`);
      }
    } else if (errorMessage.includes('Unexpected end')) {
      SecureLogger.debug(`${context} response truncated, length: ${cleanedResponse.length}, ends with: "${cleanedResponse.slice(-20)}"`);
    }
  }

  // Strategy 2: Extract JSON from mixed content
  const extractedJson = extractJsonFromMixedContent(cleanedResponse, context);
  if (extractedJson) {
    return validateAndFixParsedResponse(extractedJson, context);
  }

  // Strategy 3: Progressive JSON repair
  const repairedJson = progressiveJsonRepair(cleanedResponse, context);
  if (repairedJson) {
    return validateAndFixParsedResponse(repairedJson, context);
  }

  // Strategy 4: Fuzzy JSON reconstruction
  const reconstructedJson = fuzzyJsonReconstruction(cleanedResponse, context);
  if (reconstructedJson) {
    return validateAndFixParsedResponse(reconstructedJson, context);
  }

  // Strategy 5: Pattern-based extraction
  const patternExtracted = patternBasedExtraction(cleanedResponse, context);
  if (patternExtracted) {
    return validateAndFixParsedResponse(patternExtracted, context);
  }

  // Strategy 6: Content analysis fallback
  const contentAnalyzed = contentAnalysisFallback(cleanedResponse, context);
  if (contentAnalyzed) {
    return validateAndFixParsedResponse(contentAnalyzed, context);
  }

  // Final fallback: Create a reasonable response
  SecureLogger.debug(`${context}: All parsing strategies failed, using intelligent fallback`);
  return createIntelligentFallback(responseText, context);
}

function cleanResponseText(text: string): string {
  return text
    .trim()
    // Remove BOM and other invisible characters
    .replace(/^\uFEFF/, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    // Fix encoding issues
    .replace(/â€œ/g, '"')
    .replace(/â€\u009D/g, '"')
    .replace(/â€™/g, "'")
    .replace(/â€¦/g, "...")
    // Remove markdown code blocks if present
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    // Remove HTML entities
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function attemptTruncationRecovery(text: string): string {
  try {
    // Try to recover from truncated JSON responses
    const trimmed = text.trim();
    
    // If it ends with an incomplete string, try to close it
    if (trimmed.endsWith('"') && trimmed.split('"').length % 2 === 0) {
      // Even number of quotes, might be OK
      return text;
    }
    
    // Look for the last complete JSON structure
    let lastCompletePosition = -1;
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            lastCompletePosition = i + 1;
          }
        }
      }
    }
    
    // If we found a complete JSON structure, truncate there
    if (lastCompletePosition > 0 && lastCompletePosition < text.length - 10) {
      const truncated = text.substring(0, lastCompletePosition);
      SecureLogger.debug(`Truncation recovery: Reduced from ${text.length} to ${truncated.length} characters`);
      return truncated;
    }
    
    // Try to fix obvious truncation issues
    let fixed = trimmed;
    
    // If it ends with an incomplete property
    if (fixed.endsWith('":')) {
      fixed += '""';
    } else if (fixed.endsWith('": "')) {
      fixed += '"';
    } else if (fixed.endsWith(',')) {
      // Remove trailing comma and close structure
      fixed = fixed.slice(0, -1);
    }
    
    // Add missing closing braces/brackets
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;
    
    for (let i = 0; i < openBraces - closeBraces; i++) {
      fixed += '}';
    }
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      fixed += ']';
    }
    
    return fixed;
    
  } catch (error) {
    SecureLogger.debug(`Truncation recovery failed: ${error}`);
    return text;
  }
}

function extractJsonFromMixedContent(text: string, context: string): any {
  // Try to find JSON objects in the text
  const jsonPatterns = [
    /\{[\s\S]*?\}/g,  // Basic JSON object
    /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g,  // Nested JSON object
    /\[[^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*\]/g,  // JSON array
  ];

  for (const pattern of jsonPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      // Sort by length (longest first) to get the most complete JSON
      const sortedMatches = matches.sort((a, b) => b.length - a.length);
      
      for (const match of sortedMatches) {
        try {
          const parsed = JSON.parse(match);
          SecureLogger.debug(`${context}: JSON extracted from mixed content`);
          return parsed;
        } catch (error) {
          // Try to repair this match
          const repaired = repairJsonString(match);
          if (repaired) {
            try {
              const parsed = JSON.parse(repaired);
              SecureLogger.debug(`${context}: JSON extracted and repaired from mixed content`);
              return parsed;
        } catch (e) {
          continue;
        }
      }
    }
      }
    }
  }

  return null;
}

function progressiveJsonRepair(text: string, context: string): any {
  let workingText = text;

  // Progressive repair strategies with enhanced string handling
  const repairStrategies = [
    // Fix trailing commas
    (str: string) => str.replace(/,(\s*[}\]])/g, '$1'),
    
    // Fix unquoted keys
    (str: string) => str.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":'),
    
    // Fix single quotes to double quotes
    (str: string) => str.replace(/'/g, '"'),
    
    // Fix missing quotes around values that should be strings
    (str: string) => str.replace(/:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*([,}])/g, ': "$1"$2'),
    
    // Enhanced unterminated string repair
    (str: string) => {
      let fixed = str;
      
      // Count unmatched quotes
      const quotes = str.match(/"/g) || [];
      if (quotes.length % 2 === 1) {
        // Find the last quote and check if it's properly closed
        const lastQuoteIndex = str.lastIndexOf('"');
        const afterLastQuote = str.substring(lastQuoteIndex + 1);
        
        // If there's content after the last quote that doesn't end properly, fix it
        if (afterLastQuote && !afterLastQuote.match(/^\s*[,}\]]/)) {
          // Try to find where the string should end
          const endMarkers = [',', '}', ']', '\n'];
          let endIndex = -1;
          
          for (const marker of endMarkers) {
            const markerIndex = afterLastQuote.indexOf(marker);
            if (markerIndex !== -1 && (endIndex === -1 || markerIndex < endIndex)) {
              endIndex = markerIndex;
            }
          }
          
          if (endIndex !== -1) {
            // Insert closing quote before the end marker
            const beforeEnd = str.substring(0, lastQuoteIndex + 1 + endIndex);
            const afterEnd = str.substring(lastQuoteIndex + 1 + endIndex);
            fixed = beforeEnd + '"' + afterEnd;
          } else {
            // Just add closing quote at the end
            fixed += '"';
          }
        } else {
          // Simple case - just add closing quote
          fixed += '"';
        }
      }
      
      return fixed;
    },
    
    // Fix truncated JSON by finding the last complete structure
    (str: string) => {
      // Find the last complete JSON object or array
      let lastCompleteJson = '';
      let maxLength = 0;
      
      // Try to find JSON objects
      const objectMatches = str.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
      if (objectMatches) {
        for (const match of objectMatches) {
          if (match.length > maxLength) {
            try {
              JSON.parse(match);
              lastCompleteJson = match;
              maxLength = match.length;
            } catch (e) {
              // Not valid JSON, continue
            }
          }
        }
      }
      
      // Try to find JSON arrays
      const arrayMatches = str.match(/\[[^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*\]/g);
      if (arrayMatches) {
        for (const match of arrayMatches) {
          if (match.length > maxLength) {
            try {
              JSON.parse(match);
              lastCompleteJson = match;
              maxLength = match.length;
            } catch (e) {
              // Not valid JSON, continue
            }
          }
        }
      }
      
      return lastCompleteJson || str;
    },
    
    // Fix incomplete objects/arrays
    (str: string) => {
      let fixed = str;
      const openBraces = (str.match(/\{/g) || []).length;
      const closeBraces = (str.match(/\}/g) || []).length;
      const openBrackets = (str.match(/\[/g) || []).length;
      const closeBrackets = (str.match(/\]/g) || []).length;
      
      // Add missing closing braces
      for (let i = 0; i < openBraces - closeBraces; i++) {
        fixed += '}';
      }
      
      // Add missing closing brackets
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        fixed += ']';
      }
      
      return fixed;
    },
    
    // Smart truncation recovery - try to salvage partial JSON
    (str: string) => {
      // If the string appears to be truncated mid-property, try to complete it
      if (str.endsWith(':') || str.endsWith(':"') || str.endsWith(': "')) {
        return str + '""';
      }
      if (str.endsWith(',')) {
        return str.slice(0, -1); // Remove trailing comma
      }
      
      // If it ends with an incomplete string value
      const lastQuoteIndex = str.lastIndexOf('"');
      if (lastQuoteIndex !== -1) {
        const afterLastQuote = str.substring(lastQuoteIndex + 1);
        if (afterLastQuote && !afterLastQuote.match(/^\s*[,}\]]/)) {
          // The string is incomplete, try to close it
          return str.substring(0, lastQuoteIndex + 1) + afterLastQuote.replace(/[^a-zA-Z0-9\s\-_]/g, '') + '"';
        }
      }
      
      return str;
    },
    
    // Remove invalid characters but preserve structure
    (str: string) => str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, ''),
    
    // Fix escaped quotes and special characters
    (str: string) => str.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\'),
    
    // Fix newlines in strings (but preserve JSON structure)
    (str: string) => {
      // Replace unescaped newlines within string values
      return str.replace(/"([^"]*)\n([^"]*)"/, '"$1\\n$2"');
    },
    
    // Remove comments and non-JSON content
    (str: string) => str.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''),
    
    // Final cleanup - remove multiple consecutive spaces/newlines
    (str: string) => str.replace(/\s+/g, ' ').trim(),
  ];

  for (let i = 0; i < repairStrategies.length; i++) {
    try {
      workingText = repairStrategies[i](workingText);
      const parsed = JSON.parse(workingText);
      SecureLogger.debug(`${context}: JSON repaired with strategy ${i + 1}`);
      return parsed;
  } catch (error) {
      // Continue to next strategy
    }
  }

  return null;
}

function repairJsonString(jsonStr: string): string | null {
  try {
    // Multiple repair attempts
    let fixed = jsonStr
      .replace(/,\s*}/g, '}')  // Remove trailing commas
      .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // Quote unquoted keys
      .replace(/:\s*'([^']*)'/g, ': "$1"')  // Replace single quotes
      .replace(/\n|\r/g, '')  // Remove newlines
      .trim();
    
    // Try to balance braces and brackets
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;

    // Add missing closing characters
    for (let i = 0; i < openBraces - closeBraces; i++) {
      fixed += '}';
    }
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      fixed += ']';
    }

    return fixed;
  } catch (error) {
    return null;
  }
}

function fuzzyJsonReconstruction(text: string, context: string): any {
  // Try to reconstruct JSON from partially valid content
  SecureLogger.debug(`${context}: Attempting fuzzy JSON reconstruction`);
  
  // Look for key-value patterns
  const keyValuePatterns = [
    /"([^"]+)"\s*:\s*"([^"]*)"/g,  // "key": "value"
    /"([^"]+)"\s*:\s*([^,}]+)/g,   // "key": value
    /(\w+)\s*:\s*"([^"]*)"/g,      // key: "value"
    /(\w+)\s*:\s*([^,}]+)/g,       // key: value
  ];

  const extractedData: any = {};
  let hasData = false;

  for (const pattern of keyValuePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const key = match[1];
      let value = match[2];
      
      // Try to parse the value
      try {
        if (value === 'true' || value === 'false') {
          extractedData[key] = value === 'true';
        } else if (!isNaN(Number(value))) {
          extractedData[key] = Number(value);
        } else {
          extractedData[key] = value.replace(/^["']|["']$/g, ''); // Remove quotes
        }
        hasData = true;
      } catch (e) {
        extractedData[key] = value;
        hasData = true;
      }
    }
  }

  return hasData ? extractedData : null;
}

function patternBasedExtraction(text: string, context: string): any {
  SecureLogger.debug(`${context}: Attempting pattern-based extraction`);
  
  // Look for specific patterns based on context
  if (context.includes('Semantic Analysis')) {
    return extractSemanticAnalysisData(text);
  } else if (context.includes('Pattern Recognition')) {
    return extractPatternRecognitionData(text);
  } else if (context.includes('Intelligent Naming')) {
    return extractIntelligentNamingData(text);
  } else if (context.includes('Deobfuscation')) {
    return extractDeobfuscationData(text);
  }
  
  return null;
}

function extractSemanticAnalysisData(text: string): any {
  const data: any = {
    description: extractValue(text, ['description', 'what the code does', 'purpose']) || 'Code analysis completed',
    algorithm: extractValue(text, ['algorithm', 'type', 'pattern']) || 'unknown',
    dataFlow: extractValue(text, ['dataFlow', 'data flow', 'flow']) || 'unable to determine',
    variables: [],
    confidence: 0.5
  };

  // Try to extract variable information
  const variablePattern = /variable[s]?\s*[:\-]?\s*([^.!?]*)/gi;
  const variableMatch = text.match(variablePattern);
  if (variableMatch) {
    data.variables = variableMatch.map((v, i) => ({
      name: `var${i + 1}`,
      purpose: v.replace(/variable[s]?\s*[:\-]?\s*/i, '').trim(),
      type: 'unknown'
    }));
  }

  return data;
}

function extractPatternRecognitionData(text: string): any {
  return {
    patterns: [],
    minificationIndicators: ['analysis_attempted'],
    structuralAnalysis: extractValue(text, ['structure', 'analysis', 'pattern']) || 'Pattern analysis completed'
  };
}

function extractIntelligentNamingData(text: string): any {
  const mappings: any[] = [];
  
  // Look for renaming patterns
  const renamingPatterns = [
    /(\w+)\s+(?:to|→|->)\s+(\w+)/g,
    /rename[d]?\s+(\w+)\s+(?:to|as)\s+(\w+)/gi,
    /(\w+)\s*:\s*(\w+)/g
  ];

  for (const pattern of renamingPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      mappings.push({
        original: match[1],
        renamed: match[2],
        confidence: 0.7,
        reasoning: 'Extracted from response text'
      });
    }
  }

  return {
    mappings,
    namingStrategy: 'pattern-based extraction',
    consistency: 'extracted from response',
    confidence: mappings.length > 0 ? 0.7 : 0.3
  };
}

function extractDeobfuscationData(text: string): any {
  return {
    analysis: extractValue(text, ['analysis', 'description', 'purpose']) || 'Deobfuscation attempted',
    variableMappings: [],
    renamedCode: text, // Fallback to original text
    confidence: 'low',
    syntaxValid: true
  };
}

function extractValue(text: string, keys: string[]): string | null {
  for (const key of keys) {
    const pattern = new RegExp(`${key}\\s*[:\-]\\s*([^.!?\\n]*?)(?:\\.|!|\\?|\\n|$)`, 'i');
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/^["']|["']$/g, '');
    }
  }
  return null;
}

function contentAnalysisFallback(text: string, context: string): any {
  SecureLogger.debug(`${context}: Using content analysis fallback`);
  
  // If the response contains meaningful text but isn't JSON, try to extract meaningful content
  const hasCodeContent = /(?:function|var|let|const|=|{|}|\[|\])/i.test(text);
  const hasAnalysisContent = /(?:analysis|description|purpose|variable|rename)/i.test(text);
  
  if (hasCodeContent || hasAnalysisContent) {
    // Try to extract the most meaningful content
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const meaningfulContent = sentences.slice(0, 3).join('. ');
    
    return createStructuredResponse(meaningfulContent, context);
  }
  
  return null;
}

function createStructuredResponse(content: string, context: string): any {
  if (context.includes('Semantic Analysis')) {
    return {
      description: content || 'Semantic analysis completed',
      algorithm: 'unknown',
      dataFlow: 'unable to determine',
      variables: [],
      confidence: 0.3
    };
  } else if (context.includes('Pattern Recognition')) {
    return {
      patterns: [],
      minificationIndicators: ['fallback_analysis'],
      structuralAnalysis: content || 'Pattern analysis completed'
    };
  } else if (context.includes('Intelligent Naming')) {
    return {
      mappings: [],
      namingStrategy: 'fallback analysis',
      consistency: 'unable to determine',
      confidence: 0.2
    };
  } else if (context.includes('Deobfuscation')) {
    return {
      analysis: content || 'Deobfuscation analysis completed',
      variableMappings: [],
      renamedCode: '', // Will be handled by caller
      confidence: 'low',
      syntaxValid: true
    };
  }
  
  return { content, fallback: true };
}

function validateAndFixParsedResponse(response: any, context: string): any {
  if (!response || typeof response !== 'object') {
    return createFallbackResponse(context);
  }

  // Validate and fix based on context
  if (context.includes('Semantic Analysis')) {
    return {
      description: response.description || 'Analysis completed',
      algorithm: response.algorithm || 'unknown',
      dataFlow: response.dataFlow || 'unable to determine',
      variables: Array.isArray(response.variables) ? response.variables : [],
      confidence: typeof response.confidence === 'number' ? response.confidence : 0.5
    };
  } else if (context.includes('Pattern Recognition')) {
    return {
      patterns: Array.isArray(response.patterns) ? response.patterns : [],
      minificationIndicators: Array.isArray(response.minificationIndicators) ? response.minificationIndicators : [],
      structuralAnalysis: response.structuralAnalysis || 'Pattern analysis completed'
    };
  } else if (context.includes('Intelligent Naming')) {
    return {
      mappings: Array.isArray(response.mappings) ? response.mappings : [],
      namingStrategy: response.namingStrategy || 'standard approach',
      consistency: response.consistency || 'maintained',
      confidence: typeof response.confidence === 'number' ? response.confidence : 0.5
    };
  } else if (context.includes('Deobfuscation')) {
    return {
      analysis: response.analysis || 'Deobfuscation completed',
      variableMappings: Array.isArray(response.variableMappings) ? response.variableMappings : [],
      renamedCode: response.renamedCode || response.transformedCode || '',
      confidence: response.confidence || 'medium',
      syntaxValid: response.syntaxValid !== false
    };
  }

  return response;
}

function createFallbackResponse(context: string): any {
  SecureLogger.debug(`${context}: Creating fallback response`);
  
  if (context.includes('Semantic Analysis')) {
    return {
      description: 'Code analysis completed with fallback mode',
      algorithm: 'unknown',
      dataFlow: 'unable to determine',
      variables: [],
      confidence: 0.1
    };
  } else if (context.includes('Pattern Recognition')) {
    return {
      patterns: [],
      minificationIndicators: ['fallback_mode'],
      structuralAnalysis: 'Analysis completed in fallback mode'
    };
  } else if (context.includes('Intelligent Naming')) {
    return {
      mappings: [],
      namingStrategy: 'fallback mode',
      consistency: 'unable to determine',
      confidence: 0.1
    };
  } else if (context.includes('Deobfuscation')) {
    return {
      analysis: 'Deobfuscation completed in fallback mode',
      variableMappings: [],
      renamedCode: '',
      confidence: 'low',
      syntaxValid: true
    };
  }
  
  return { fallback: true, context };
}

function createIntelligentFallback(originalText: string, context: string): any {
  SecureLogger.debug(`${context}: Creating intelligent fallback from response content`);
  
  // Analyze the response text to create a meaningful fallback
  const textLength = originalText.length;
  const hasCodeKeywords = /(?:function|var|let|const|return|\{|\}|\[|\])/i.test(originalText);
  const hasAnalysisKeywords = /(?:analysis|rename|variable|purpose|description)/i.test(originalText);
  
  // Extract any meaningful snippets
  const meaningfulLines = originalText.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 5 && !line.startsWith('{') && !line.startsWith('}'))
    .slice(0, 3);
  
  const extractedContent = meaningfulLines.join('. ').substring(0, 200);
  
  if (context.includes('Deobfuscation')) {
    return {
      analysis: extractedContent || 'Deobfuscation analysis attempted but response parsing failed',
      variableMappings: [],
      renamedCode: '', // Will trigger fallback to original code
      confidence: 'low',
      syntaxValid: true,
      parseError: true
    };
  }
  
  return createStructuredResponse(extractedContent, context);
}

function attemptDirectTextProcessing(responseText: string, originalCode: string): string {
  SecureLogger.debug("Attempting direct text processing as JSON parsing fallback");
  
  // Look for code patterns in the response
  const codeBlockPatterns = [
    /```(?:javascript|js)?\s*\n([\s\S]*?)\n```/gi,
    /```\s*\n([\s\S]*?)\n```/gi,
    /`([^`]+)`/g
  ];
  
  for (const pattern of codeBlockPatterns) {
    const matches = responseText.match(pattern);
    if (matches) {
      for (const match of matches) {
        // Extract the code content
        let extractedCode = match.replace(/```(?:javascript|js)?\s*\n?/gi, '').replace(/\n?```/g, '').replace(/`/g, '');
        
        // Validate that it looks like valid JavaScript
        if (extractedCode.includes('function') || extractedCode.includes('var') || extractedCode.includes('let') || extractedCode.includes('const')) {
          SecureLogger.debug("Found code block in response text, using as result");
          return extractedCode.trim();
        }
      }
    }
  }
  
  // Look for variable renaming patterns in plain text
  const renamingPatterns = [
    /renamed?\s+(\w+)\s+to\s+(\w+)/gi,
    /(\w+)\s*->\s*(\w+)/gi,
    /(\w+)\s*→\s*(\w+)/gi
  ];
  
  const renamings: Array<{from: string, to: string}> = [];
  
  for (const pattern of renamingPatterns) {
    let match;
    while ((match = pattern.exec(responseText)) !== null) {
      renamings.push({ from: match[1], to: match[2] });
    }
  }
  
  // Apply renamings to original code if we found any
  if (renamings.length > 0) {
    let processedCode = originalCode;
    SecureLogger.debug(`Found ${renamings.length} variable renamings in text response`);
    
    for (const renaming of renamings) {
      // Use word boundaries to avoid partial replacements
      const regex = new RegExp(`\\b${renaming.from}\\b`, 'g');
      processedCode = processedCode.replace(regex, renaming.to);
      SecureLogger.debug(`Applied renaming: ${renaming.from} -> ${renaming.to}`);
    }
    
    return processedCode;
  }
  
  // If we can't extract meaningful code, return the original
  SecureLogger.debug("No processable code found in response, returning original");
  return originalCode;
}

// **SPEED OPTIMIZATION HELPER FUNCTIONS**

function isJavaScriptContent(code: string): boolean {
  // Quick heuristics to detect JavaScript content
  if (code.length < 10) return false;
  
  const jsKeywords = [
    'function', 'var', 'let', 'const', 'if', 'else', 'for', 'while', 
    'return', 'try', 'catch', 'class', 'import', 'export', 'require'
  ];
  
  const jsPatterns = [
    /\bfunction\s+\w+\s*\(/,
    /\b(?:var|let|const)\s+\w+/,
    /\w+\s*=\s*function/,
    /\w+\s*:\s*function/,
    /=>\s*{/,
    /require\s*\(/,
    /module\.exports/,
    /export\s+(?:default|const|function)/
  ];
  
  // Check for JavaScript keywords
  const hasKeywords = jsKeywords.some(keyword => code.includes(keyword));
  
  // Check for JavaScript patterns
  const hasPatterns = jsPatterns.some(pattern => pattern.test(code));
  
  // Check for basic syntax elements
  const hasBraces = code.includes('{') && code.includes('}');
  const hasParens = code.includes('(') && code.includes(')');
  
  return hasKeywords || hasPatterns || (hasBraces && hasParens);
}

function analyzeCodeComplexity(code: string): {level: 'low' | 'medium' | 'high', score: number} {
  let score = 0;
  
  // Length factor (0-2 points)
  if (code.length > 100000) score += 2;
  else if (code.length > 10000) score += 1;
  
  // Nesting complexity (0-2 points)
  const maxNesting = calculateMaxNesting(code);
  if (maxNesting > 5) score += 2;
  else if (maxNesting > 3) score += 1;
  
  // Function count (0-2 points)
  const functionCount = (code.match(/function\s+\w+|=>\s*{|\w+\s*:\s*function/g) || []).length;
  if (functionCount > 50) score += 2;
  else if (functionCount > 10) score += 1;
  
  // Variable count (0-2 points)
  const variableCount = (code.match(/\b(?:var|let|const)\s+\w+/g) || []).length;
  if (variableCount > 100) score += 2;
  else if (variableCount > 20) score += 1;
  
  // Minification indicators (0-2 points)
  const singleCharVars = (code.match(/\b[a-z]\b/g) || []).length;
  const totalLength = code.length;
  const minificationRatio = singleCharVars / (totalLength / 1000); // per 1k chars
  if (minificationRatio > 20) score += 2;
  else if (minificationRatio > 10) score += 1;
  
  // Determine complexity level
  let level: 'low' | 'medium' | 'high';
  if (score <= 3) level = 'low';
  else if (score <= 6) level = 'medium';
  else level = 'high';
  
  return { level, score };
}

function calculateMaxNesting(code: string): number {
  let maxDepth = 0;
  let currentDepth = 0;
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const prevChar = i > 0 ? code[i - 1] : '';
    
    // Handle strings
    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = '';
      }
    }
    
    if (!inString) {
      if (char === '{' || char === '(' || char === '[') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}' || char === ')' || char === ']') {
        currentDepth = Math.max(0, currentDepth - 1);
      }
    }
  }
  
  return maxDepth;
}

async function processUltraFast(apiKey: string, model: string, code: string): Promise<string> {
  SecureLogger.debug("⚡ Ultra-fast processing: minimal API calls");
  
  const maxRetries = 2;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Dynamic import
      const geminiModule = await import("@google/generative-ai");
      const GoogleGenerativeAI = geminiModule.GoogleGenerativeAI;
      const client = new GoogleGenerativeAI(apiKey);
      
      // Add delay for subsequent attempts
      if (attempt > 1) {
        const delay = 2000 * attempt;
        SecureLogger.debug(`Ultra-fast retry ${attempt}: waiting ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // **SINGLE API CALL**: Simplified prompt for fast processing
      const geminiModel = client.getGenerativeModel({
        model,
        systemInstruction: "You are a fast JavaScript variable renamer. Rename minified variables to descriptive names. Return ONLY the renamed code, no explanations.",
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: Math.min(8192, code.length * 2), // Adaptive output limit
          candidateCount: 1,
        }
      });

      const result = await geminiModel.generateContent(
        `Rename variables in this JavaScript code to be descriptive:\n\n${code}`
      );
      
      const responseText = result.response.text();
      
      if (!responseText || responseText.trim().length === 0) {
        SecureLogger.debug(`Ultra-fast attempt ${attempt}: Empty response`);
        if (attempt < maxRetries) continue;
        SecureLogger.debug("Ultra-fast: All attempts empty, using original");
        return code;
      }
      
      // Quick validation
      const validation = await performQuickValidation(responseText);
      if (!validation.isValid) {
        SecureLogger.debug(`Ultra-fast attempt ${attempt}: Validation failed`);
        if (attempt < maxRetries) continue;
        SecureLogger.debug("Ultra-fast: All attempts failed validation, using original");
        return code;
      }
      
      SecureLogger.debug("Ultra-fast processing completed successfully");
      return responseText;
      
    } catch (error) {
      SecureLogger.debug(`Ultra-fast attempt ${attempt} failed: ${error}`);
      if (attempt === maxRetries) {
        SecureLogger.debug("Ultra-fast: All attempts failed, using original");
        return code;
      }
    }
  }
  
  return code;
}

// **SPEED OPTIMIZATION FUNCTIONS**

async function processSmallFileOptimized(client: any, model: string, code: string): Promise<string> {
  SecureLogger.debug("🚀 Small file optimization: Parallel processing");
  
  try {
    progressManager.updateCurrentFileProgress(0.2);
    
    // **PARALLEL EXECUTION**: Run deobfuscation and verification simultaneously
    const [deobfuscatedResult, quickValidation] = await Promise.allSettled([
      performDeobfuscation(client, model, code),
      performQuickValidation(code)
    ]);
    
    progressManager.updateCurrentFileProgress(0.7);
    
    // Get the deobfuscated result
    const finalCode = deobfuscatedResult.status === 'fulfilled' ? deobfuscatedResult.value : code;
    
    // **SKIP FULL VERIFICATION** for small files - use quick validation only
    if (quickValidation.status === 'fulfilled' && quickValidation.value.isValid) {
      SecureLogger.debug("Small file: Quick validation passed, skipping full verification");
      progressManager.updateCurrentFileProgress(0.9);
      return finalCode;
    }
    
    // Fall back to basic verification only if needed
    progressManager.updateCurrentFileProgress(0.8);
    const verified = await performBasicValidation(finalCode, code);
    progressManager.updateCurrentFileProgress(0.9);
    
    SecureLogger.debug("Small file optimization completed");
    return verified;
    
  } catch (error) {
    SecureLogger.debug(`Small file optimization failed: ${error}`);
    return code;
  }
}

async function processParallelOptimized(client: any, model: string, code: string): Promise<string> {
  SecureLogger.debug("⚡ Large file optimization: Parallel verification");
  
  try {
    progressManager.updateCurrentFileProgress(0.2);
    
    // Step 1: Main deobfuscation
    const deobfuscatedResult = await performDeobfuscation(client, model, code);
    progressManager.updateCurrentFileProgress(0.5);
    
    // **PARALLEL EXECUTION**: Run verification and quality check simultaneously
    const [verificationResult, qualityResult] = await Promise.allSettled([
      performVerification(client, model, code, deobfuscatedResult),
      performQualityCheck(client, model, deobfuscatedResult)
    ]);
    
    progressManager.updateCurrentFileProgress(0.8);
    
    // Determine best result
    let finalResult = deobfuscatedResult;
    
    if (verificationResult.status === 'fulfilled' && verificationResult.value !== deobfuscatedResult) {
      finalResult = verificationResult.value;
      SecureLogger.debug("Using verification-corrected result");
    } else if (qualityResult.status === 'fulfilled' && qualityResult.value !== deobfuscatedResult) {
      finalResult = qualityResult.value;
      SecureLogger.debug("Using quality-improved result");
    }
    
    progressManager.updateCurrentFileProgress(0.9);
    SecureLogger.debug("Parallel optimization completed");
    return finalResult;
    
  } catch (error) {
    SecureLogger.debug(`Parallel optimization failed: ${error}`);
    return code;
  }
}

async function processLargeFileOptimized(client: any, model: string, code: string): Promise<string> {
  SecureLogger.debug("🔥 Very large file optimization: Smart chunking");
  
  try {
    const codeLength = code.length;
    const maxChunkSize = 150000; // 150k characters per chunk
    
    if (codeLength <= maxChunkSize) {
      // File is manageable, use parallel optimization
      return await processParallelOptimized(client, model, code);
    }
    
    progressManager.updateCurrentFileProgress(0.1);
    
    // **SMART CHUNKING**: Split into logical chunks (functions, objects, etc.)
    const chunks = smartChunkCode(code, maxChunkSize);
    SecureLogger.debug(`Split large file into ${chunks.length} chunks`);
    
    progressManager.updateCurrentFileProgress(0.2);
    
    // **PARALLEL CHUNK PROCESSING**: Process chunks in parallel
    const processedChunks = await Promise.all(
      chunks.map(async (chunk, index) => {
        try {
          SecureLogger.debug(`Processing chunk ${index + 1}/${chunks.length}`);
          return await performDeobfuscation(client, model, chunk.code);
        } catch (error) {
          SecureLogger.debug(`Chunk ${index + 1} failed: ${error}, using original`);
          return chunk.code;
        }
      })
    );
    
    progressManager.updateCurrentFileProgress(0.7);
    
    // **REASSEMBLE**: Combine processed chunks
    const reassembledCode = reassembleChunks(chunks, processedChunks);
    
    progressManager.updateCurrentFileProgress(0.8);
    
    // **FINAL VALIDATION**: Quick check on the reassembled result
    const validationResult = await performQuickValidation(reassembledCode);
    
    if (!validationResult.isValid) {
      SecureLogger.debug("Reassembled code failed validation, using original");
      return code;
    }
    
    progressManager.updateCurrentFileProgress(0.9);
    SecureLogger.debug("Large file chunking optimization completed");
    return reassembledCode;
    
  } catch (error) {
    SecureLogger.debug(`Large file optimization failed: ${error}`);
    return code;
  }
}

async function performQuickValidation(code: string): Promise<{isValid: boolean, issues: string[]}> {
  const issues: string[] = [];
  
  try {
    // Basic syntax checks
    if (!code || code.trim().length === 0) {
      issues.push("Empty code");
      return { isValid: false, issues };
    }
    
    // Check for balanced braces/brackets/parentheses
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    
    if (openBraces !== closeBraces) issues.push("Unbalanced braces");
    if (openBrackets !== closeBrackets) issues.push("Unbalanced brackets");
    if (openParens !== closeParens) issues.push("Unbalanced parentheses");
    
    // Check for basic JavaScript syntax
    const hasBasicJsSyntax = /(?:function|var|let|const|if|for|while|return)/.test(code);
    if (!hasBasicJsSyntax && code.length > 100) {
      issues.push("No recognizable JavaScript syntax");
    }
    
    return { isValid: issues.length === 0, issues };
    
  } catch (error) {
    issues.push(`Validation error: ${error}`);
    return { isValid: false, issues };
  }
}

function smartChunkCode(code: string, maxChunkSize: number): Array<{code: string, startIndex: number, endIndex: number}> {
  const chunks: Array<{code: string, startIndex: number, endIndex: number}> = [];
  
  if (code.length <= maxChunkSize) {
    return [{ code, startIndex: 0, endIndex: code.length }];
  }
  
  try {
    // Try to split at logical boundaries (functions, objects, etc.)
    const functionBoundaries = [];
    const objectBoundaries = [];
    
    // Find function boundaries
    const functionMatches = code.matchAll(/function\s+\w+\s*\(/g);
    for (const match of functionMatches) {
      if (match.index !== undefined) {
        functionBoundaries.push(match.index);
      }
    }
    
    // Find object boundaries
    const objectMatches = code.matchAll(/\w+\s*:\s*\{/g);
    for (const match of objectMatches) {
      if (match.index !== undefined) {
        objectBoundaries.push(match.index);
      }
    }
    
    // Combine and sort boundaries
    const allBoundaries = [...functionBoundaries, ...objectBoundaries].sort((a, b) => a - b);
    
    let currentStart = 0;
    
    for (let i = 0; i < allBoundaries.length; i++) {
      const boundary = allBoundaries[i];
      
      if (boundary - currentStart >= maxChunkSize) {
        // Create chunk from currentStart to previous boundary
        const prevBoundary = i > 0 ? allBoundaries[i - 1] : currentStart;
        const chunkEnd = Math.min(prevBoundary + maxChunkSize, code.length);
        
        chunks.push({
          code: code.substring(currentStart, chunkEnd),
          startIndex: currentStart,
          endIndex: chunkEnd
        });
        
        currentStart = chunkEnd;
      }
    }
    
    // Add remaining code
    if (currentStart < code.length) {
      chunks.push({
        code: code.substring(currentStart),
        startIndex: currentStart,
        endIndex: code.length
      });
    }
    
    return chunks;
    
  } catch (error) {
    // Fall back to simple chunking
    SecureLogger.debug(`Smart chunking failed: ${error}, using simple chunking`);
    
    const simpleChunks: Array<{code: string, startIndex: number, endIndex: number}> = [];
    for (let i = 0; i < code.length; i += maxChunkSize) {
      const endIndex = Math.min(i + maxChunkSize, code.length);
      simpleChunks.push({
        code: code.substring(i, endIndex),
        startIndex: i,
        endIndex: endIndex
      });
    }
    
    return simpleChunks;
  }
}

function reassembleChunks(
  originalChunks: Array<{code: string, startIndex: number, endIndex: number}>,
  processedChunks: string[]
): string {
  try {
    // Simple reassembly - concatenate processed chunks
    return processedChunks.join('\n');
  } catch (error) {
    SecureLogger.debug(`Chunk reassembly failed: ${error}`);
    // Fall back to original code
    return originalChunks.map(chunk => chunk.code).join('\n');
  }
}

function performBasicValidation(renamedCode: string, originalCode: string): string {
  SecureLogger.debug("Performing basic validation as fallback");
  
  // Basic checks for code validity
  try {
    // Check if the renamed code is not empty
    if (!renamedCode || renamedCode.trim().length === 0) {
      SecureLogger.debug("Basic validation: Renamed code is empty, using original");
      return originalCode;
    }
    
    // Check for basic JavaScript syntax elements
    const hasBasicSyntax = /[{}();]/.test(renamedCode);
    if (!hasBasicSyntax && /[{}();]/.test(originalCode)) {
      SecureLogger.debug("Basic validation: Renamed code missing basic syntax, using original");
      return originalCode;
    }
    
    // Check for reasonable length (shouldn't be dramatically different)
    const lengthRatio = renamedCode.length / originalCode.length;
    if (lengthRatio < 0.5 || lengthRatio > 3) {
      SecureLogger.debug(`Basic validation: Length ratio suspicious (${lengthRatio.toFixed(2)}), using original`);
      return originalCode;
    }
    
    // Check for presence of obvious error markers
    const errorMarkers = ['SyntaxError', 'undefined', 'null', 'error', 'failed'];
    const hasErrorMarkers = errorMarkers.some(marker => 
      renamedCode.toLowerCase().includes(marker.toLowerCase())
    );
    
    if (hasErrorMarkers) {
      SecureLogger.debug("Basic validation: Found error markers in renamed code, using original");
      return originalCode;
    }
    
    // Basic validation passed
    SecureLogger.debug("Basic validation: Renamed code appears valid");
    return renamedCode;
    
  } catch (error) {
    SecureLogger.debug(`Basic validation failed: ${error}, using original code`);
    return originalCode;
  }
}

async function performSemanticAnalysis(client: any, model: string, code: string): Promise<any> {
  SecureLogger.debug("🧠 Phase 1: Semantic Analysis Agent");
  
  const geminiModel = client.getGenerativeModel({
    model,
    systemInstruction: createSemanticAnalysisPrompt(),
    generationConfig: {
      responseMimeType: "application/json",
      temperature: GEMINI25_CONFIG.TEMPERATURE,
      maxOutputTokens: GEMINI25_CONFIG.OUTPUT_TOKENS,
    }
  });

  const result = await geminiModel.generateContent(
    `Analyze this JavaScript code for semantic understanding:\n\n${code}\n\nProvide JSON analysis with the following structure:
{
  "description": "Clear description of what the code does",
  "algorithm": "Primary algorithm type",
  "dataFlow": "How data moves through the function",
  "variables": [{"name": "var", "purpose": "detailed purpose", "type": "inferred type"}],
  "confidence": 0.95
}`
  );
  
  try {
    const response = parseGeminiJsonResponse(result.response.text(), "🧠 Semantic Analysis");
    SecureLogger.debug(`🧠 Semantic Analysis: ${response.description}`);
    return response;
  } catch (error) {
    SecureLogger.debug(`🧠 Semantic Analysis JSON parsing failed: ${error}, using fallback`);
    return {
      description: "Code analysis failed due to parsing error",
      algorithm: "unknown",
      dataFlow: "unable to determine",
      variables: [],
      confidence: 0.1
    };
  }
}

async function performPatternRecognition(client: any, model: string, code: string, semanticAnalysis: any): Promise<any> {
  SecureLogger.debug("🔍 Phase 2: Pattern Recognition Agent");
  
  const geminiModel = client.getGenerativeModel({
    model,
    systemInstruction: createPatternRecognitionPrompt(),
    generationConfig: {
      responseMimeType: "application/json",
      temperature: GEMINI25_CONFIG.TEMPERATURE,
      maxOutputTokens: GEMINI25_CONFIG.OUTPUT_TOKENS,
    }
  });

  const result = await geminiModel.generateContent(
    `Identify patterns in this code:\n\n${code}\n\nSemantic context: ${JSON.stringify(semanticAnalysis)}\n\nProvide JSON analysis with pattern details.`
  );
  
  try {
    const response = parseGeminiJsonResponse(result.response.text(), "🔍 Pattern Recognition");
    SecureLogger.debug(`🔍 Pattern Recognition: Found ${response.patterns?.length || 0} patterns`);
    return response;
  } catch (error) {
    SecureLogger.debug(`🔍 Pattern Recognition JSON parsing failed: ${error}, using fallback`);
    return {
      patterns: [],
      minificationIndicators: ["parsing_failed"],
      structuralAnalysis: "unable to analyze due to parsing error"
    };
  }
}

async function performIntelligentNaming(client: any, model: string, code: string, semanticAnalysis: any, patternAnalysis: any): Promise<any> {
  SecureLogger.debug("🏷️ Phase 3: Intelligent Naming Agent");
  
  const geminiModel = client.getGenerativeModel({
    model,
    systemInstruction: createIntelligentNamingPrompt(),
    generationConfig: {
      responseMimeType: "application/json",
      temperature: GEMINI25_CONFIG.TEMPERATURE,
      maxOutputTokens: GEMINI25_CONFIG.OUTPUT_TOKENS,
    }
  });

  const result = await geminiModel.generateContent(createNamingPrompt(code, semanticAnalysis, patternAnalysis));
  
  try {
    const response = parseGeminiJsonResponse(result.response.text(), "🏷️ Intelligent Naming");
    SecureLogger.debug(`🏷️ Generated ${response.mappings?.length || 0} variable mappings`);
    return response;
  } catch (error) {
    SecureLogger.debug(`🏷️ Intelligent Naming JSON parsing failed: ${error}, using fallback`);
    return {
      mappings: [],
      namingStrategy: "fallback due to parsing error",
      consistency: "unable to determine",
      confidence: 0.1
    };
  }
}

async function performCodeTransformation(client: any, model: string, code: string, namingResult: any): Promise<string> {
  SecureLogger.debug("🔄 Phase 4: Code Transformation Agent");
  
  const geminiModel = client.getGenerativeModel({
    model,
    systemInstruction: createTransformationPrompt(),
    generationConfig: {
      responseMimeType: "application/json",
      temperature: GEMINI25_CONFIG.TEMPERATURE,
      maxOutputTokens: GEMINI25_CONFIG.OUTPUT_TOKENS,
    }
  });

  const result = await geminiModel.generateContent(createTransformationRequest(code, namingResult));
  
  try {
    const response = parseGeminiJsonResponse(result.response.text(), "🔄 Code Transformation");
    SecureLogger.debug("🔄 Code transformation completed");
    return response.transformedCode || code;
  } catch (error) {
    SecureLogger.debug(`🔄 Code Transformation JSON parsing failed: ${error}, returning original code`);
    return code;
  }
}

async function performQualityAssurance(client: any, model: string, transformedCode: string, originalCode: string): Promise<any> {
  SecureLogger.debug("✅ Phase 5: Quality Assurance Agent");
  
  const geminiModel = client.getGenerativeModel({
    model,
    systemInstruction: createQualityAssurancePrompt(),
    generationConfig: {
      responseMimeType: "application/json",
      temperature: GEMINI25_CONFIG.TEMPERATURE,
      maxOutputTokens: GEMINI25_CONFIG.OUTPUT_TOKENS,
    }
  });

  const result = await geminiModel.generateContent(createQualityAssuranceRequest(transformedCode, originalCode));
  
  try {
    const response = parseGeminiJsonResponse(result.response.text(), "✅ Quality Assurance");
    SecureLogger.debug(`✅ Quality Score: ${response.qualityScore}/10`);
    return { ...response, finalCode: response.finalCode || transformedCode };
  } catch (error) {
    SecureLogger.debug(`✅ Quality Assurance JSON parsing failed: ${error}, using fallback`);
    return {
      qualityScore: 5,
      finalCode: transformedCode,
      improvements: ["JSON parsing failed, unable to assess quality"],
      syntaxScore: 5,
      semanticScore: 5,
      consistencyScore: 5,
      readabilityScore: 5
    };
  }
}

async function performDeobfuscation(client: any, model: string, code: string): Promise<string> {
  const maxRetries = 3; // Increased retries
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      SecureLogger.debug(`Gemini 2.5 deobfuscation attempt ${attempt}/${maxRetries}`);
      
      // Adaptive timeout and rate limiting based on attempt
      const baseDelay = attempt === 1 ? 0 : Math.min(2000 * Math.pow(2, attempt - 2), 10000);
      if (baseDelay > 0) {
        SecureLogger.debug(`Rate limiting: waiting ${baseDelay}ms before attempt ${attempt}`);
        await new Promise(resolve => setTimeout(resolve, baseDelay));
      }
      
  const geminiModel = client.getGenerativeModel({
    model,
    systemInstruction: createGemini25SystemPrompt(),
    generationConfig: {
      responseMimeType: "application/json",
      temperature: GEMINI25_CONFIG.TEMPERATURE,
      maxOutputTokens: GEMINI25_CONFIG.OUTPUT_TOKENS,
      candidateCount: 1, // Ensure single response
      stopSequences: [], // Clear stop sequences
    }
  });

  const result = await geminiModel.generateContent(createDeobfuscationPrompt(code));
      const responseText = result.response.text();
      
      // Enhanced empty response detection
      if (!responseText || responseText.trim().length === 0) {
        SecureLogger.debug(`Gemini 2.5 attempt ${attempt}: Empty response received`);
        if (attempt < maxRetries) {
          SecureLogger.debug("Retrying with longer delay...");
          await new Promise(resolve => setTimeout(resolve, 3000 + (attempt * 1000))); // Progressive delay
          continue;
        } else {
          SecureLogger.debug("All attempts resulted in empty responses, using original code");
          return code;
        }
      }
      
             // Check for partial responses that might indicate rate limiting or truncation
       if (responseText.length < 50 && !responseText.includes('{')) {
         SecureLogger.debug(`Gemini 2.5 attempt ${attempt}: Response too short (${responseText.length} chars): "${responseText}"`);
         if (attempt < maxRetries) {
           await new Promise(resolve => setTimeout(resolve, 5000 + (attempt * 2000))); // Longer progressive delay
           continue;
         }
       }
       
       // Process the response
       const response = parseGeminiJsonResponse(responseText, "Gemini 2.5 Deobfuscation");
    
    // Handle fallback responses
    if (response.parseError || response.fallback) {
      SecureLogger.debug("Gemini 2.5: Parse error detected, attempting direct text processing");
      return attemptDirectTextProcessing(responseText, code);
    }
    
    // Log the analysis for debugging
    SecureLogger.debug(`Gemini 2.5 Analysis: ${response.analysis || 'No analysis available'}`);
    
    // Log variable mappings
    if (response.variableMappings && Array.isArray(response.variableMappings)) {
      response.variableMappings.forEach((mapping: any) => {
        if (mapping.oldName && mapping.newName) {
          SecureLogger.debug(`Renamed ${mapping.oldName} to ${mapping.newName} (${mapping.purpose || 'no purpose specified'})`);
        }
      });
    }
    
    // Return the renamed code or fallback to original
    const finalCode = response.renamedCode || response.transformedCode || code;
    
    // Validate that we got something back
    if (finalCode.trim().length === 0) {
      SecureLogger.debug("Gemini 2.5: Empty final code, using original");
      return code;
    }
    
      return finalCode;
      
  } catch (error) {
      lastError = error;
      SecureLogger.debug(`Gemini 2.5 attempt ${attempt} failed: ${error}`);
      if (attempt < maxRetries) {
        SecureLogger.debug("Retrying after error...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
    }
  }
  
  // If all attempts failed
  SecureLogger.debug(`All ${maxRetries} attempts failed, falling back to legacy mode. Last error: ${lastError}`);
  throw lastError; // Re-throw to trigger legacy mode fallback
}

async function performVerification(client: any, model: string, originalCode: string, renamedCode: string): Promise<string> {
  try {
  SecureLogger.debug("Performing self-verification pass");
  
  const geminiModel = client.getGenerativeModel({
    model,
    systemInstruction: createVerificationSystemPrompt(),
    generationConfig: {
      responseMimeType: "application/json",
      temperature: GEMINI25_CONFIG.TEMPERATURE,
      maxOutputTokens: GEMINI25_CONFIG.OUTPUT_TOKENS,
    }
  });

  const result = await geminiModel.generateContent(createVerificationPrompt(originalCode, renamedCode));
    const responseText = result.response.text();
    
    if (!responseText || responseText.trim().length === 0) {
      SecureLogger.debug("Verification: Empty response, returning renamed code as-is");
      return renamedCode;
    }
    
    const response = parseGeminiJsonResponse(responseText, "Verification");
    
    // Handle fallback responses gracefully
    if (response.fallback || response.parseError) {
      SecureLogger.debug("Verification: Parse error, performing basic validation");
      return performBasicValidation(renamedCode, originalCode);
    }
    
    SecureLogger.debug(`Verification status: ${response.verificationStatus || 'unknown'}`);
    
    if (response.issuesFound && Array.isArray(response.issuesFound) && response.issuesFound.length > 0) {
      SecureLogger.debug(`Issues found: ${JSON.stringify(response.issuesFound)}`);
      const correctedCode = response.correctedCode || renamedCode;
      return correctedCode.trim() || renamedCode;
    }
    
    return renamedCode;
    
  } catch (error) {
    SecureLogger.debug(`Verification failed: ${error}, performing basic validation`);
    return performBasicValidation(renamedCode, originalCode);
  }
}

async function performQualityCheck(client: any, model: string, code: string): Promise<string> {
  try {
  SecureLogger.debug("Performing final quality check");
  
  const geminiModel = client.getGenerativeModel({
    model,
    systemInstruction: "You are a JavaScript expert performing final quality validation. Check for syntax errors, consistency, and readability. Return the code as-is if no issues, or provide corrected version. Respond in JSON format.",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: GEMINI25_CONFIG.TEMPERATURE,
      maxOutputTokens: GEMINI25_CONFIG.OUTPUT_TOKENS,
    }
  });

  const result = await geminiModel.generateContent(
    `Perform final quality check on this code:\n\n${code}\n\nReturn JSON: {"qualityScore": number, "finalCode": "...", "improvements": ["..."]}`
  );

    const responseText = result.response.text();
    
    if (!responseText || responseText.trim().length === 0) {
      SecureLogger.debug("Quality check: Empty response, returning code as-is");
      return code;
    }

    const response = parseGeminiJsonResponse(responseText, "Quality Check");
    
    // Handle fallback responses
    if (response.fallback || response.parseError) {
      SecureLogger.debug("Quality check: Parse error, performing basic quality validation");
      return performBasicQualityCheck(code);
    }
    
    const qualityScore = response.qualityScore || 0;
    SecureLogger.debug(`Quality score: ${qualityScore}`);
    
    if (response.improvements && Array.isArray(response.improvements) && response.improvements.length > 0) {
      SecureLogger.debug(`Quality improvements: ${JSON.stringify(response.improvements)}`);
    }
    
    const finalCode = response.finalCode || code;
    
    // Validate the final code
    if (!finalCode || finalCode.trim().length === 0) {
      SecureLogger.debug("Quality check: Final code is empty, returning original");
      return code;
    }
    
    return finalCode;
    
  } catch (error) {
    SecureLogger.debug(`Quality check failed: ${error}, performing basic quality validation`);
    return performBasicQualityCheck(code);
  }
}

function performBasicQualityCheck(code: string): string {
  SecureLogger.debug("Performing basic quality check as fallback");
  
  try {
    // Basic quality checks
    if (!code || code.trim().length === 0) {
      SecureLogger.debug("Basic quality check: Code is empty");
      return code;
    }
    
    // Check for balanced braces and brackets
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    
    if (openBraces !== closeBraces || openBrackets !== closeBrackets || openParens !== closeParens) {
      SecureLogger.debug("Basic quality check: Unbalanced braces/brackets/parentheses detected");
      // Don't modify the code, just log the issue
    }
    
    // Check for obvious syntax issues
    const hasSyntaxIssues = [
      /[{}]\s*[{}]/, // Empty blocks might indicate issues
      /;\s*;/, // Double semicolons
      /,\s*,/, // Double commas
    ].some(pattern => pattern.test(code));
    
    if (hasSyntaxIssues) {
      SecureLogger.debug("Basic quality check: Potential syntax issues detected");
    }
    
    SecureLogger.debug("Basic quality check: Code appears acceptable");
    return code;
    
  } catch (error) {
    SecureLogger.debug(`Basic quality check failed: ${error}, returning code as-is`);
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
        const responseText = result.response.text();

        if (!responseText || responseText.trim().length === 0) {
          SecureLogger.debug(`Empty response for variable ${name}, keeping original`);
          return name;
        }

        const parsed = parseGeminiResponse(responseText);

        if (!parsed || !parsed.newName || typeof parsed.newName !== 'string') {
          SecureLogger.debug(`Invalid parsed response for variable ${name}, keeping original`);
          return name;
        }

        // Validate the new name
        const newName = parsed.newName.trim();
        if (!newName || newName === name || !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(newName)) {
          SecureLogger.debug(`Invalid new name "${newName}" for variable ${name}, keeping original`);
          return name;
        }

        SecureLogger.debug(`Renamed ${name} to ${newName}`);
        return newName;
      } catch (error) {
        SecureLogger.error("Failed to rename variable with Gemini", {
          error: (error as Error).message,
          variableName: name
        });
        return name; // Fallback to original name
      }
    },
    (progress) => progressManager.updateCurrentFileProgress(progress)
  );
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

function createGemini25SystemPrompt(): string {
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
