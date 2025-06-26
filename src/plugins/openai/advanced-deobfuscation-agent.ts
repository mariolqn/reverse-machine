import OpenAI from "openai";
import { SecureLogger } from "../../security/secure-logger.js";

// Advanced GPT-4.1 Multi-Agent Configuration
const AGENT_CONFIG = {
  CONTEXT_TOKENS: 1000000,
  OUTPUT_TOKENS: 32000,
  TEMPERATURE: 0.05, // Ultra-low for maximum consistency
  MAX_RETRIES: 3,
};

// JavaScript Knowledge Base for RAG
const JS_KNOWLEDGE_BASE = {
  commonPatterns: [
    { pattern: "function a(e,t)", meaning: "Function with parameters", naming: "descriptive function name" },
    { pattern: "var n=[]", meaning: "Array initialization", naming: "pluralized noun for collections" },
    { pattern: "for(var r=0", meaning: "Loop counter", naming: "index, i, or descriptive counter" },
    { pattern: "e.length", meaning: "Array/string length property", naming: "keep semantic meaning" },
    { pattern: "t.push(", meaning: "Array push operation", naming: "action + object pattern" },
    { pattern: "return n", meaning: "Return statement", naming: "maintain return consistency" }
  ],
  namingConventions: {
    functions: ["camelCase", "verbNoun pattern", "describe action clearly"],
    variables: ["camelCase", "descriptive nouns", "avoid abbreviations"],
    parameters: ["descriptive of purpose", "match function intent", "standard naming"]
  },
  semanticHints: {
    loops: "index, currentIndex, iterator, position",
    arrays: "list, collection, items, results, output",
    strings: "text, input, content, message",
    numbers: "count, length, size, index, value",
    objects: "data, config, options, properties"
  }
};

export interface AdvancedDeobfuscationResult {
  deobfuscatedCode: string;
  confidence: number;
  analysis: {
    syntaxScore: number;
    semanticScore: number;
    consistencyScore: number;
    readabilityScore: number;
  };
  variableMappings: Array<{
    original: string;
    renamed: string;
    confidence: number;
    reasoning: string;
  }>;
  improvements: string[];
  processingTime: number;
}

export class AdvancedDeobfuscationAgent {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = "gpt-4.1") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async deobfuscate(code: string): Promise<AdvancedDeobfuscationResult> {
    const startTime = Date.now();
    SecureLogger.debug("🚀 Starting Advanced Multi-Agent Deobfuscation");

    try {
      // Phase 1: Semantic Analysis Agent
      const semanticAnalysis = await this.performSemanticAnalysis(code);
      
      // Phase 2: Pattern Recognition Agent  
      const patternAnalysis = await this.performPatternRecognition(code, semanticAnalysis);
      
      // Phase 3: Variable Naming Agent
      const namingResult = await this.performIntelligentNaming(code, semanticAnalysis, patternAnalysis);
      
      // Phase 4: Code Transformation Agent
      const transformedCode = await this.performCodeTransformation(code, namingResult);
      
      // Phase 5: Quality Assurance Agent
      const qualityResult = await this.performQualityAssurance(transformedCode, code);
      
      // Phase 6: Self-Correction Agent (if needed)
      const finalCode = qualityResult.needsCorrection 
        ? await this.performSelfCorrection(transformedCode, qualityResult.issues)
        : transformedCode;

      const processingTime = Date.now() - startTime;

      return {
        deobfuscatedCode: finalCode,
        confidence: this.calculateOverallConfidence([semanticAnalysis, patternAnalysis, namingResult, qualityResult]),
        analysis: {
          syntaxScore: qualityResult.syntaxScore,
          semanticScore: semanticAnalysis.confidence,
          consistencyScore: qualityResult.consistencyScore,
          readabilityScore: qualityResult.readabilityScore
        },
        variableMappings: namingResult.mappings,
        improvements: qualityResult.suggestions,
        processingTime
      };

    } catch (error) {
      SecureLogger.debug(`❌ Advanced deobfuscation failed: ${error}`);
      throw error;
    }
  }

  private async performSemanticAnalysis(code: string): Promise<any> {
    SecureLogger.debug("🧠 Phase 1: Semantic Analysis Agent");
    
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: AGENT_CONFIG.TEMPERATURE,
      max_tokens: AGENT_CONFIG.OUTPUT_TOKENS,
      messages: [
        {
          role: "system",
          content: this.createSemanticAnalysisPrompt()
        },
        {
          role: "user",
          content: `Analyze this JavaScript code for semantic understanding:\n\n${code}\n\nProvide JSON analysis.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message?.content || "{}");
    SecureLogger.debug(`🧠 Semantic Analysis: ${result.description}`);
    return result;
  }

  private async performPatternRecognition(code: string, semanticAnalysis: any): Promise<any> {
    SecureLogger.debug("🔍 Phase 2: Pattern Recognition Agent");
    
    const relevantPatterns = this.findRelevantPatterns(code);
    
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: AGENT_CONFIG.TEMPERATURE,
      max_tokens: AGENT_CONFIG.OUTPUT_TOKENS,
      messages: [
        {
          role: "system",
          content: this.createPatternRecognitionPrompt(relevantPatterns)
        },
        {
          role: "user",
          content: `Identify patterns in this code:\n\n${code}\n\nSemantic context: ${JSON.stringify(semanticAnalysis)}\n\nProvide JSON analysis.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message?.content || "{}");
    SecureLogger.debug(`🔍 Pattern Recognition: Found ${result.patterns?.length || 0} patterns`);
    return result;
  }

  private async performIntelligentNaming(code: string, semanticAnalysis: any, patternAnalysis: any): Promise<any> {
    SecureLogger.debug("🏷️ Phase 3: Intelligent Naming Agent");
    
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: AGENT_CONFIG.TEMPERATURE,
      max_tokens: AGENT_CONFIG.OUTPUT_TOKENS,
      messages: [
        {
          role: "system",
          content: this.createIntelligentNamingPrompt()
        },
        {
          role: "user",
          content: this.createNamingPrompt(code, semanticAnalysis, patternAnalysis)
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message?.content || "{}");
    SecureLogger.debug(`🏷️ Generated ${result.mappings?.length || 0} variable mappings`);
    return result;
  }

  private async performCodeTransformation(code: string, namingResult: any): Promise<string> {
    SecureLogger.debug("🔄 Phase 4: Code Transformation Agent");
    
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: AGENT_CONFIG.TEMPERATURE,
      max_tokens: AGENT_CONFIG.OUTPUT_TOKENS,
      messages: [
        {
          role: "system",
          content: this.createTransformationPrompt()
        },
        {
          role: "user",
          content: this.createTransformationRequest(code, namingResult)
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message?.content || "{}");
    SecureLogger.debug("🔄 Code transformation completed");
    return result.transformedCode || code;
  }

  private async performQualityAssurance(transformedCode: string, originalCode: string): Promise<any> {
    SecureLogger.debug("✅ Phase 5: Quality Assurance Agent");
    
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: AGENT_CONFIG.TEMPERATURE,
      max_tokens: AGENT_CONFIG.OUTPUT_TOKENS,
      messages: [
        {
          role: "system",
          content: this.createQualityAssurancePrompt()
        },
        {
          role: "user",
          content: this.createQualityAssuranceRequest(transformedCode, originalCode)
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message?.content || "{}");
    SecureLogger.debug(`✅ Quality Score: ${result.overallScore}/10`);
    return result;
  }

  private async performSelfCorrection(code: string, issues: string[]): Promise<string> {
    SecureLogger.debug("🔧 Phase 6: Self-Correction Agent");
    
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: AGENT_CONFIG.TEMPERATURE,
      max_tokens: AGENT_CONFIG.OUTPUT_TOKENS,
      messages: [
        {
          role: "system",
          content: "You are a self-correction specialist. Fix the identified issues while maintaining code functionality. Respond with JSON containing the corrected code."
        },
        {
          role: "user",
          content: `Fix these issues in the code:\n\nIssues: ${JSON.stringify(issues)}\n\nCode:\n${code}\n\nProvide JSON with corrected code.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message?.content || "{}");
    SecureLogger.debug("🔧 Self-correction completed");
    return result.correctedCode || code;
  }

  // Helper methods for creating specialized prompts
  private createSemanticAnalysisPrompt(): string {
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

  private createPatternRecognitionPrompt(patterns: any[]): string {
    return `You are a JavaScript pattern recognition specialist with deep knowledge of common coding patterns and minification techniques.

KNOWLEDGE BASE:
${JSON.stringify(JS_KNOWLEDGE_BASE.commonPatterns, null, 2)}

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

  private createIntelligentNamingPrompt(): string {
    return `You are an elite variable naming specialist with expertise in creating semantically perfect, readable variable names.

NAMING EXCELLENCE STANDARDS:
1. **Semantic Precision**: Names must perfectly capture the variable's purpose
2. **Contextual Awareness**: Consider the broader function context
3. **Consistency**: Related variables follow consistent naming patterns
4. **Readability**: Names should be immediately understandable
5. **Convention Adherence**: Follow JavaScript best practices

NAMING CONVENTIONS:
${JSON.stringify(JS_KNOWLEDGE_BASE.namingConventions, null, 2)}

SEMANTIC HINTS:
${JSON.stringify(JS_KNOWLEDGE_BASE.semanticHints, null, 2)}

QUALITY METRICS:
- Descriptiveness (avoid abbreviations)
- Consistency across related variables
- Semantic accuracy
- Professional naming standards

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

  private createTransformationPrompt(): string {
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

  private createQualityAssurancePrompt(): string {
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
  "overallScore": 9.1,
  "needsCorrection": false,
  "issues": ["specific issues if any"],
  "suggestions": ["improvement recommendations"]
}`;
  }

  // Helper methods for creating specialized requests
  private createNamingPrompt(code: string, semanticAnalysis: any, patternAnalysis: any): string {
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

  private createTransformationRequest(code: string, namingResult: any): string {
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

  private createQualityAssuranceRequest(transformedCode: string, originalCode: string): string {
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

  // Utility methods
  private findRelevantPatterns(code: string): any[] {
    return JS_KNOWLEDGE_BASE.commonPatterns.filter(pattern => 
      code.includes(pattern.pattern.substring(0, 5))
    );
  }

  private calculateOverallConfidence(results: any[]): number {
    const confidences = results
      .map(r => r.confidence)
      .filter(c => typeof c === 'number' && c > 0);
    
    return confidences.length > 0 
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length 
      : 0.8;
  }
} 