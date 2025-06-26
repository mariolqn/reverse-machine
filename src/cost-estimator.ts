import fs from "node:fs/promises";
import path from "node:path";
import { SecureLogger } from "./security/secure-logger.js";
import { setupProcessingContext, isProcessableFile } from "./input-handler.js";

// Model pricing data (per 1M tokens, updated for 2025)
const MODEL_PRICING = {
  anthropic: {
    "claude-4-opus-20250514": { input: 15.00, output: 75.00 },
    "claude-4-opus-20250514-reasoning": { input: 15.00, output: 75.00 },
    "claude-4-sonnet-20250514": { input: 3.00, output: 15.00 },
    "claude-4-sonnet-20250514-reasoning": { input: 3.00, output: 15.00 },
    "claude-3-5-sonnet-latest": { input: 3.00, output: 15.00 },
    "claude-3-5-sonnet-20241022": { input: 3.00, output: 15.00 },
    "claude-3-5-haiku-latest": { input: 0.80, output: 4.00 },
    "claude-3-5-haiku-20241022": { input: 0.80, output: 4.00 },
    "claude-3-opus-latest": { input: 15.00, output: 75.00 },
    "claude-3-opus-20240229": { input: 15.00, output: 75.00 },
    "claude-3-sonnet-20240229": { input: 3.00, output: 15.00 },
    "claude-3-haiku-20240307": { input: 0.25, output: 1.25 }
  },
  openai: {
    "gpt-4.1": { input: 2.00, output: 8.00 },
    "gpt-4o": { input: 2.50, output: 10.00 },
    "gpt-4o-mini": { input: 0.15, output: 0.60 },
    "gpt-4.1-mini": { input: 0.40, output: 1.60 },
    "gpt-4.1-nano": { input: 0.10, output: 0.40 },
    "o1": { input: 15.00, output: 60.00 },
    "o3": { input: 10.00, output: 40.00 },
    "o3-mini": { input: 1.10, output: 4.40 },
    "o4-mini": { input: 1.10, output: 4.40 }
  },
  gemini: {
    "gemini-2.5-pro": { input: 1.25, output: 10.00, inputLong: 2.50, outputLong: 15.00, threshold: 200000 },
    "gemini-2.5-flash": { input: 0.30, output: 2.50 },
    "gemini-2.0-flash": { input: 0.10, output: 0.40 },
    "gemini-1.5-pro-latest": { input: 1.25, output: 5.00, inputLong: 2.50, outputLong: 10.00, threshold: 128000 },
    "gemini-1.5-pro": { input: 1.25, output: 5.00, inputLong: 2.50, outputLong: 10.00, threshold: 128000 },
    "gemini-1.5-flash-latest": { input: 0.075, output: 0.30, inputLong: 0.15, outputLong: 0.60, threshold: 128000 },
    "gemini-1.5-flash": { input: 0.075, output: 0.30, inputLong: 0.15, outputLong: 0.60, threshold: 128000 },
    "gemini-1.0-pro": { input: 0.50, output: 1.50 }
  }
} as const;

export interface CostEstimate {
  provider: string;
  model: string;
  totalFiles: number;
  totalInputTokens: number;
  estimatedOutputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  breakdown: FileBreakdown[];
  assumptions: string[];
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';
  riskWarning: string;
  estimatedRange: { min: number; max: number };
}

interface FileBreakdown {
  filePath: string;
  fileSize: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  fileCost: number;
}

export async function estimateDeobfuscationCost(
  inputPath: string,
  provider: 'anthropic' | 'openai' | 'gemini',
  model: string,
  useAdvancedAgent = true
): Promise<CostEstimate> {
  SecureLogger.debug(`Estimating cost for ${provider}/${model} on ${inputPath}`);
  
  // Setup processing context to get all files that would be processed
  const context = await setupProcessingContext(inputPath);
  
  const pricing = MODEL_PRICING[provider][model as keyof typeof MODEL_PRICING[typeof provider]];
  if (!pricing) {
    throw new Error(`Unknown model: ${provider}/${model}`);
  }
  
  const breakdown: FileBreakdown[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalInputCost = 0;
  let totalOutputCost = 0;
  
  // Process each file for cost estimation
  for (const filePath of context.files) {
    try {
      const code = await fs.readFile(filePath, 'utf-8');
      const fileSize = Buffer.byteLength(code, 'utf-8');
      
      // Estimate tokens for this file
      const inputTokens = estimateInputTokens(code, provider, model, useAdvancedAgent);
      const outputTokens = estimateOutputTokens(code, provider, model, useAdvancedAgent);
      
      // Calculate costs for this file
      const { inputCost, outputCost } = calculateCostForTokens(
        inputTokens,
        outputTokens,
        pricing as any,
        inputTokens // Use input tokens for context length determination
      );
      
      breakdown.push({
        filePath: path.relative(process.cwd(), filePath),
        fileSize,
        estimatedInputTokens: inputTokens,
        estimatedOutputTokens: outputTokens,
        fileCost: inputCost + outputCost
      });
      
      totalInputTokens += inputTokens;
      totalOutputTokens += outputTokens;
      totalInputCost += inputCost;
      totalOutputCost += outputCost;
      
    } catch (error) {
      SecureLogger.debug(`Skipping file ${filePath}: ${error}`);
    }
  }
  
  const assumptions = generateCostAssumptions(provider, model, useAdvancedAgent);
  const { confidenceLevel, riskWarning, estimatedRange } = calculateConfidenceMetrics(
    totalInputCost + totalOutputCost,
    useAdvancedAgent,
    context.files.length,
    totalInputTokens
  );
  
  return {
    provider,
    model,
    totalFiles: context.files.length,
    totalInputTokens,
    estimatedOutputTokens: totalOutputTokens,
    inputCost: totalInputCost,
    outputCost: totalOutputCost,
    totalCost: totalInputCost + totalOutputCost,
    breakdown,
    assumptions,
    confidenceLevel,
    riskWarning,
    estimatedRange
  };
}

function estimateInputTokens(
  code: string,
  provider: string,
  model: string,
  useAdvancedAgent: boolean
): number {
  // Base token estimation - heavily minified code can be very dense
  // Using more conservative 2.5 chars/token for worst case scenarios
  const baseTokens = Math.ceil(code.length / 2.5);
  
  if (useAdvancedAgent) {
    // REALITY CHECK: Based on user experience, advanced agents use EXPONENTIALLY more tokens
    // User spent $49+ on OpenAI GPT-4.1 and didn't finish - suggests 3-8x underestimation
    
    // Advanced mode reality:
    // - Each phase (5 total) includes ALL previous context
    // - Context grows exponentially: Phase1 -> Phase2(includes Phase1) -> Phase3(includes Phase1+2) etc.
    // - Large files get processed in chunks, but with overlap
    // - Multiple retry attempts on failures
    // - Extensive analysis and verification steps
    
    const exponentialGrowthFactor = Math.min(8.0, 3.0 + (code.length / 100000)); // Scales with file size
    const phaseAccumulation = 5; // 5 phases
    const retryFactor = 1.4; // Account for retries and error handling
    const verificationOverhead = 1.3; // Quality checks and analysis
    
    // Conservative estimate based on real usage
    const advancedMultiplier = exponentialGrowthFactor * phaseAccumulation * retryFactor * verificationOverhead;
    
    if (provider === 'anthropic') {
      return Math.ceil(baseTokens * advancedMultiplier * 1.1); // Claude has reasoning tokens
    } else if (provider === 'openai') {
      return Math.ceil(baseTokens * advancedMultiplier); // Base calculation
    } else if (provider === 'gemini') {
      return Math.ceil(baseTokens * advancedMultiplier * 0.9); // Slightly more efficient
    }
  } else {
    // Basic mode is much more predictable - single pass with known overhead
    const systemPromptTokens = {
      anthropic: 2500,
      openai: 2000,
      gemini: 1500
    }[provider] || 2000;
    
    const processingOverhead = Math.max(1000, baseTokens * 0.15); // 15% overhead or 1000 tokens, whichever is higher
    
    return Math.ceil(baseTokens + systemPromptTokens + processingOverhead);
  }
  
  return baseTokens;
}

function estimateOutputTokens(
  code: string,
  provider: string,
  model: string,
  useAdvancedAgent: boolean
): number {
  // Base output estimation using same conservative token ratio
  const baseTokens = Math.ceil(code.length / 2.5);
  
  if (useAdvancedAgent) {
    // REALITY: Advanced mode generates massive amounts of output
    // - Each phase produces detailed analysis
    // - All phases are cumulative (include previous results)
    // - Extensive documentation and reasoning
    // - Multiple verification rounds
    // - Quality scores and confidence metrics
    
    const phaseCount = 5;
    const analysisPerPhase = baseTokens * 0.8; // Each phase analyzes the code
    const cumulativeGrowth = 1.6; // Each phase includes more context
    const reasoningTokens = baseTokens * 0.5; // Thinking/reasoning for each phase
    const metadataPerPhase = 3000; // Variable mappings, scores, analysis
    
    // Calculate escalating output per phase
    let totalOutput = 0;
    for (let phase = 1; phase <= phaseCount; phase++) {
      const phaseOutput = (analysisPerPhase + reasoningTokens) * Math.pow(cumulativeGrowth, phase - 1);
      totalOutput += phaseOutput + metadataPerPhase;
    }
    
    // Add final consolidation output
    const finalOutput = baseTokens * 2.0; // Final cleaned code + comprehensive analysis
    
    if (provider === 'anthropic') {
      // Claude has additional reasoning tokens that count toward output pricing
      return Math.ceil((totalOutput + finalOutput) * 1.3);
    } else if (provider === 'openai') {
      return Math.ceil(totalOutput + finalOutput);
    } else if (provider === 'gemini') {
      // Gemini tends to be more concise but still comprehensive
      return Math.ceil((totalOutput + finalOutput) * 0.9);
    }
  } else {
    // Basic mode: single pass with predictable output
    const deobfuscatedCode = baseTokens * 1.4; // Code expansion factor
    const variableMappings = Math.min(5000, baseTokens * 0.2); // Variable name mappings
    const basicAnalysis = 1500; // Simple analysis and metadata
    
    return Math.ceil(deobfuscatedCode + variableMappings + basicAnalysis);
  }
  
  return baseTokens;
}

function calculateCostForTokens(
  inputTokens: number,
  outputTokens: number,
  pricing: any,
  contextLength: number
): { inputCost: number; outputCost: number } {
  // Handle models with context-based pricing (Gemini models)
  let inputPrice = pricing.input;
  let outputPrice = pricing.output;
  
  if (pricing.threshold && contextLength > pricing.threshold) {
    inputPrice = pricing.inputLong || pricing.input;
    outputPrice = pricing.outputLong || pricing.output;
  }
  
  const inputCost = (inputTokens / 1_000_000) * inputPrice;
  const outputCost = (outputTokens / 1_000_000) * outputPrice;
  
  return { inputCost, outputCost };
}

function generateCostAssumptions(
  provider: string,
  model: string,
  useAdvancedAgent: boolean
): string[] {
  const assumptions = [
    "🎯 Token estimation based on ~2.5 characters per token (conservative for minified code)",
    "💰 Costs calculated using current 2025 API pricing",
    "📊 Estimates based on real-world usage patterns and user feedback",
  ];
  
  if (useAdvancedAgent) {
    assumptions.push(
      "🚨 WARNING: Advanced mode estimates may still be 20-50% lower than actual costs",
      "🔴 EXPONENTIAL SCALING: Each phase includes cumulative context from all previous phases",
      "🔄 RETRY FACTOR: Failed attempts and error recovery add significant overhead",
      "📈 LARGE FILES: Files >500KB can trigger exponential cost growth",
      "⚠️ BUDGET RISK: Advanced mode can easily exceed $100+ for complex projects",
      "💡 RECOMMENDATION: Use --basic mode unless quality is absolutely critical"
    );
  } else {
    assumptions.push(
      "✅ Basic mode estimates are much more reliable and predictable",
      "🎯 Single-pass processing with known overhead patterns",
      "📏 Output typically 40% larger than minified input",
      "💰 Cost scales linearly with file size"
    );
  }
  
  if (provider === 'anthropic') {
    assumptions.push("🧠 Claude models include reasoning tokens in output pricing (significant cost factor)");
  } else if (provider === 'openai') {
    assumptions.push("⚡ OpenAI models have predictable token usage patterns");
  } else if (provider === 'gemini') {
    if (model.includes('2.5-pro') || model.includes('1.5-pro')) {
      assumptions.push("📏 Gemini Pro has tiered pricing - costs increase significantly after context threshold");
    }
    assumptions.push("🔧 Gemini tends to be more concise but comprehensive in output");
  }
  
  assumptions.push(
    "🔀 Files processed sequentially to manage memory and context",
    "✂️ Files >1MB should be split manually for better cost control",
    "🎲 Actual costs depend heavily on code complexity and obfuscation techniques"
  );
  
  return assumptions;
}

function calculateConfidenceMetrics(
  estimatedCost: number,
  useAdvancedAgent: boolean,
  fileCount: number,
  totalTokens: number
): {
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';
  riskWarning: string;
  estimatedRange: { min: number; max: number };
} {
  let confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';
  let riskWarning: string;
  let uncertaintyFactor: number;
  
  if (useAdvancedAgent) {
    // Advanced mode has much higher uncertainty
    if (estimatedCost > 200) {
      confidenceLevel = 'VERY_LOW';
      uncertaintyFactor = 3.0; // Could be 3x higher
      riskWarning = "🚨 EXTREME RISK: Actual costs could easily exceed $500-1000+. Consider splitting into smaller batches or using basic mode.";
    } else if (estimatedCost > 50) {
      confidenceLevel = 'LOW';
      uncertaintyFactor = 2.5;
      riskWarning = "⚠️ HIGH RISK: Actual costs could be 2-3x higher. Monitor usage closely and consider --basic mode.";
    } else {
      confidenceLevel = 'LOW';
      uncertaintyFactor = 2.0;
      riskWarning = "⚠️ CAUTION: Advanced mode costs are unpredictable. Actual costs may be 2x higher.";
    }
  } else {
    // Basic mode is much more predictable
    if (fileCount > 100 || totalTokens > 10000000) {
      confidenceLevel = 'MEDIUM';
      uncertaintyFactor = 1.4;
      riskWarning = "📊 MODERATE CONFIDENCE: Large project may have some variation in costs.";
    } else {
      confidenceLevel = 'HIGH';
      uncertaintyFactor = 1.2;
      riskWarning = "✅ HIGH CONFIDENCE: Basic mode costs are typically within 20% of estimates.";
    }
  }
  
  const estimatedRange = {
    min: Math.max(0, estimatedCost * 0.8), // Conservative minimum
    max: estimatedCost * uncertaintyFactor
  };
  
  return { confidenceLevel, riskWarning, estimatedRange };
}

export function formatCostEstimate(estimate: CostEstimate): string {
  const confidenceEmoji = {
    'HIGH': '✅',
    'MEDIUM': '📊',
    'LOW': '⚠️',
    'VERY_LOW': '🚨'
  }[estimate.confidenceLevel];
  
  const lines = [
    `\n📊 COST ESTIMATION REPORT`,
    `${'='.repeat(50)}`,
    `Provider: ${estimate.provider.toUpperCase()}`,
    `Model: ${estimate.model}`,
    `Total Files: ${estimate.totalFiles}`,
    ``,
    `💰 COST BREAKDOWN:`,
    `Input Tokens:  ${estimate.totalInputTokens.toLocaleString()} tokens`,
    `Output Tokens: ${estimate.estimatedOutputTokens.toLocaleString()} tokens (estimated)`,
    ``,
    `Input Cost:    $${estimate.inputCost.toFixed(4)}`,
    `Output Cost:   $${estimate.outputCost.toFixed(4)}`,
    `Total Cost:    $${estimate.totalCost.toFixed(4)}`,
    ``,
    `📈 COST RANGE (${estimate.confidenceLevel} confidence):`,
    `Minimum:       $${estimate.estimatedRange.min.toFixed(2)}`,
    `Maximum:       $${estimate.estimatedRange.max.toFixed(2)}`,
    ``,
    `${confidenceEmoji} CONFIDENCE: ${estimate.confidenceLevel}`,
    `${estimate.riskWarning}`,
    ``
  ];
  
  if (estimate.breakdown.length > 0) {
    lines.push(`📁 FILE BREAKDOWN:`);
    lines.push(`${'─'.repeat(80)}`);
    lines.push(`${'File'.padEnd(40)} ${'Size'.padEnd(8)} ${'Tokens'.padEnd(8)} ${'Cost'.padEnd(8)}`);
    lines.push(`${'─'.repeat(80)}`);
    
    // Sort by cost (highest first) and show top 10
    const sortedFiles = estimate.breakdown
      .sort((a, b) => b.fileCost - a.fileCost)
      .slice(0, 10);
    
    for (const file of sortedFiles) {
      const fileName = file.filePath.length > 38 
        ? '...' + file.filePath.slice(-35)
        : file.filePath;
      const size = formatBytes(file.fileSize);
      const tokens = file.estimatedInputTokens.toLocaleString();
      const cost = `$${file.fileCost.toFixed(4)}`;
      
      lines.push(`${fileName.padEnd(40)} ${size.padEnd(8)} ${tokens.padEnd(8)} ${cost.padEnd(8)}`);
    }
    
    if (estimate.breakdown.length > 10) {
      lines.push(`... and ${estimate.breakdown.length - 10} more files`);
    }
  }
  
  lines.push('');
  lines.push('⚠️  ASSUMPTIONS:');
  for (const assumption of estimate.assumptions) {
    lines.push(`   • ${assumption}`);
  }
  
  lines.push('');
  lines.push('💡 To proceed with actual deobfuscation, remove the --cost flag');
  lines.push('');
  
  return lines.join('\n');
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
} 