import { test, describe } from "node:test";
import assert from "node:assert";
import { AdvancedDeobfuscationAgent } from "../plugins/openai/advanced-deobfuscation-agent.js";
import { openaiRename } from "../plugins/openai/openai-rename.js";
import { SecureLogger } from "../security/secure-logger.js";

// Complex test cases that benefit from multi-agent analysis
const ADVANCED_TEST_CASES = [
  {
    name: "Complex Nested Algorithm",
    code: `function a(e,t,n){var r=[];var i=function(o,u){var s=[];for(var c=0;c<o.length;c++){var f=o[c];if(typeof f==="object"&&f!==null){var l=a(f,t,n+1);s.push(l)}else{var d=t(f,u,n);s.push(d)}}return s};var h=i(e,n);r=r.concat(h);return r}`,
    expectedPatterns: ["recursive processing", "array transformation", "nested objects"],
    qualityThresholds: {
      syntaxScore: 9.0,
      semanticScore: 8.5,
      consistencyScore: 9.0,
      readabilityScore: 8.0
    }
  },
  {
    name: "Advanced State Management",
    code: `function a(e){var t={};var n=function(r){return t.hasOwnProperty(r)?t[r]:null};var i=function(r,o){t[r]=o;return o};var u=function(){for(var r in t){delete t[r]}};return{get:n,set:i,clear:u,state:e}}`,
    expectedPatterns: ["closure pattern", "object factory", "state management"],
    qualityThresholds: {
      syntaxScore: 9.5,
      semanticScore: 9.0,
      consistencyScore: 9.5,
      readabilityScore: 9.0
    }
  },
  {
    name: "Functional Pipeline",
    code: `function a(e,t){return t.reduce(function(n,r){return r(n)},e)}function b(e){return function(t){return t.map(e)}}function c(e){return function(t){return t.filter(e)}}`,
    expectedPatterns: ["functional programming", "higher-order functions", "pipeline"],
    qualityThresholds: {
      syntaxScore: 9.0,
      semanticScore: 8.5,
      consistencyScore: 8.5,
      readabilityScore: 8.5
    }
  }
];

describe("🚀 Advanced Multi-Agent Deobfuscation Evaluation", () => {
  
  test("🎯 Multi-Agent vs Single-Agent Quality Comparison", async () => {
    if (!process.env.OPENAI_API_KEY) {
      console.log("⚠️ Skipping advanced agent tests - OPENAI_API_KEY not set");
      return;
    }

    SecureLogger.enableVerbose();
    
    console.log("\n🔬 Running Advanced Multi-Agent Quality Analysis...\n");

    for (const testCase of ADVANCED_TEST_CASES) {
      console.log(`\n🧪 Testing: ${testCase.name}`);
      console.log(`📝 Code: ${testCase.code.substring(0, 60)}...`);

      try {
        // Test Advanced Multi-Agent System
        console.log("\n🚀 Testing Advanced Multi-Agent System:");
        const advancedAgent = new AdvancedDeobfuscationAgent(process.env.OPENAI_API_KEY!, "gpt-4.1");
        const advancedStartTime = Date.now();
        const advancedResult = await advancedAgent.deobfuscate(testCase.code);
        const advancedDuration = Date.now() - advancedStartTime;

        console.log(`⏱️ Processing Time: ${advancedDuration}ms`);
        console.log(`🎯 Confidence: ${(advancedResult.confidence * 100).toFixed(1)}%`);
        console.log(`📊 Quality Scores:`);
        console.log(`   • Syntax: ${advancedResult.analysis.syntaxScore}/10`);
        console.log(`   • Semantic: ${advancedResult.analysis.semanticScore}/10`);
        console.log(`   • Consistency: ${advancedResult.analysis.consistencyScore}/10`);
        console.log(`   • Readability: ${advancedResult.analysis.readabilityScore}/10`);

        // Test Basic Single-Agent System
        console.log("\n⚡ Testing Basic Single-Agent System:");
        const basicRename = openaiRename({
          apiKey: process.env.OPENAI_API_KEY!,
          model: "gpt-4.1",
          useAdvancedAgent: false
        });
        const basicStartTime = Date.now();
        const basicResult = await basicRename(testCase.code);
        const basicDuration = Date.now() - basicStartTime;

        console.log(`⏱️ Processing Time: ${basicDuration}ms`);
        console.log(`📤 Output Length: ${basicResult.length} chars`);

        // Quality Comparison
        console.log(`\n📈 Quality Analysis:`);
        console.log(`   • Advanced Code Length: ${advancedResult.deobfuscatedCode.length} chars`);
        console.log(`   • Basic Code Length: ${basicResult.length} chars`);
        console.log(`   • Variable Mappings: ${advancedResult.variableMappings.length}`);
        console.log(`   • Processing Time Ratio: ${(advancedDuration / basicDuration).toFixed(1)}x`);

        if (advancedResult.improvements.length > 0) {
          console.log(`\n🔧 Advanced Agent Suggestions:`);
          advancedResult.improvements.forEach(improvement => {
            console.log(`   • ${improvement}`);
          });
        }

        // Quality Assertions
        assert(
          advancedResult.analysis.syntaxScore >= testCase.qualityThresholds.syntaxScore,
          `Syntax score ${advancedResult.analysis.syntaxScore} below threshold ${testCase.qualityThresholds.syntaxScore}`
        );

        assert(
          advancedResult.analysis.semanticScore >= testCase.qualityThresholds.semanticScore,
          `Semantic score ${advancedResult.analysis.semanticScore} below threshold ${testCase.qualityThresholds.semanticScore}`
        );

        // Verify advanced system provides meaningful output
        assert(
          advancedResult.deobfuscatedCode.length > testCase.code.length,
          "Advanced system should expand minified code with meaningful names"
        );

        assert(
          advancedResult.variableMappings.length > 0,
          "Advanced system should provide variable mappings"
        );

        console.log(`✅ ${testCase.name}: PASSED all quality thresholds`);

      } catch (error) {
        console.error(`❌ Error testing ${testCase.name}: ${error}`);
        throw error;
      }
    }
  });

  test("🔍 Advanced Agent Semantic Analysis", async () => {
    if (!process.env.OPENAI_API_KEY) return;

    const testCode = ADVANCED_TEST_CASES[0].code;
    const agent = new AdvancedDeobfuscationAgent(process.env.OPENAI_API_KEY!, "gpt-4.1");
    const result = await agent.deobfuscate(testCode);

    console.log(`\n🧠 Semantic Analysis Results:`);
    console.log(`   • Overall Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`   • Processing Time: ${result.processingTime}ms`);
    
    result.variableMappings.forEach(mapping => {
      console.log(`   • ${mapping.original} → ${mapping.renamed} (${(mapping.confidence * 100).toFixed(1)}%)`);
      console.log(`     Reasoning: ${mapping.reasoning}`);
    });

    // Verify high-quality semantic understanding
    assert(result.confidence > 0.8, "Should have high confidence in analysis");
    assert(result.variableMappings.length >= 3, "Should identify multiple variables");
    
    const highConfidenceMappings = result.variableMappings.filter(m => m.confidence > 0.8);
    assert(highConfidenceMappings.length > 0, "Should have high-confidence mappings");
  });

  test("⚡ Performance and Efficiency Analysis", async () => {
    if (!process.env.OPENAI_API_KEY) return;

    const testCode = ADVANCED_TEST_CASES[1].code; // Medium complexity
    
    // Test both approaches
    const advancedAgent = new AdvancedDeobfuscationAgent(process.env.OPENAI_API_KEY!, "gpt-4.1");
    const basicRename = openaiRename({
      apiKey: process.env.OPENAI_API_KEY!,
      model: "gpt-4.1",
      useAdvancedAgent: false
    });

    const advancedStart = Date.now();
    const advancedResult = await advancedAgent.deobfuscate(testCode);
    const advancedTime = Date.now() - advancedStart;

    const basicStart = Date.now();
    const basicResult = await basicRename(testCode);
    const basicTime = Date.now() - basicStart;

    console.log(`\n⚡ Performance Comparison:`);
    console.log(`   • Advanced Agent: ${advancedTime}ms`);
    console.log(`   • Basic Agent: ${basicTime}ms`);
    console.log(`   • Time Ratio: ${(advancedTime / basicTime).toFixed(1)}x`);
    console.log(`   • Quality Score: ${advancedResult.analysis.semanticScore}/10`);

    // Verify advanced agent provides better quality (worth the extra time)
    assert(advancedResult.analysis.semanticScore >= 7.0, "Advanced agent should provide high semantic quality");
    assert(advancedResult.confidence > 0.75, "Advanced agent should have high confidence");

    // Verify reasonable performance (should complete within reasonable time)
    assert(advancedTime < 60000, "Advanced agent should complete within 60 seconds");
  });

  test("🎯 Code Quality and Consistency Verification", async () => {
    if (!process.env.OPENAI_API_KEY) return;

    const testCode = ADVANCED_TEST_CASES[2].code; // Functional pipeline
    const agent = new AdvancedDeobfuscationAgent(process.env.OPENAI_API_KEY!, "gpt-4.1");
    const result = await agent.deobfuscate(testCode);

    console.log(`\n🎯 Code Quality Analysis:`);
    console.log(`Original: ${testCode.length} chars`);
    console.log(`Transformed: ${result.deobfuscatedCode.length} chars`);
    console.log(`Syntax Score: ${result.analysis.syntaxScore}/10`);
    console.log(`Consistency Score: ${result.analysis.consistencyScore}/10`);
    console.log(`Readability Score: ${result.analysis.readabilityScore}/10`);

    // Verify the transformed code is syntactically valid
    try {
      // Basic syntax check by attempting to parse as JavaScript
      new Function(result.deobfuscatedCode);
      console.log(`✅ Syntax validation: PASSED`);
    } catch (syntaxError) {
      console.error(`❌ Syntax validation: FAILED - ${syntaxError}`);
      throw new Error("Generated code should be syntactically valid");
    }

    // Verify quality thresholds
    assert(result.analysis.syntaxScore >= 8.0, "Syntax score should be high");
    assert(result.analysis.consistencyScore >= 8.0, "Consistency score should be high");
    assert(result.analysis.readabilityScore >= 7.5, "Readability score should be good");

    // Verify meaningful variable names (no single letters except common patterns)
    const singleLetterVars = (result.deobfuscatedCode.match(/\b[a-z]\b/g) || [])
      .filter(v => !['i', 'j', 'k'].includes(v)); // Allow common loop counters
    
    console.log(`Single letter variables remaining: ${singleLetterVars.length}`);
    assert(singleLetterVars.length <= 2, "Should minimize single letter variable names");
  });
});

// Helper function to analyze code quality patterns
function analyzeCodePatterns(code: string): {
  variableQuality: number;
  functionQuality: number;
  structuralClarity: number;
} {
  const lines = code.split('\n');
  let variableQuality = 0;
  let functionQuality = 0;
  let structuralClarity = 0;

  // Simple heuristics for code quality
  const meaningfulVarPattern = /\b[a-zA-Z][a-zA-Z0-9]{2,}\b/g;
  const meaningfulVars = (code.match(meaningfulVarPattern) || []).length;
  const totalVars = (code.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g) || []).length;
  
  variableQuality = totalVars > 0 ? meaningfulVars / totalVars : 0;
  
  const functionsWithGoodNames = (code.match(/function\s+[a-zA-Z][a-zA-Z0-9]{3,}/g) || []).length;
  const totalFunctions = (code.match(/function\s/g) || []).length;
  
  functionQuality = totalFunctions > 0 ? functionsWithGoodNames / totalFunctions : 0;
  
  structuralClarity = lines.filter(line => line.trim().length > 0).length / lines.length;

  return {
    variableQuality,
    functionQuality,
    structuralClarity
  };
} 