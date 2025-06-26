import { test, describe } from "node:test";
import assert from "node:assert";
import { openaiRename } from "../plugins/openai/openai-rename.js";
import { SecureLogger } from "../security/secure-logger.js";

// Test cases with expected quality metrics
interface DeobfuscationTestCase {
  name: string;
  difficulty: "easy" | "medium" | "hard";
  minifiedCode: string;
  expectedVariables: Array<{
    minified: string;
    expectedSemantic: string;
    purpose: string;
  }>;
  qualityThresholds: {
    completeness: number; // % of variables renamed
    consistency: number;  // consistency score 0-1
    meaningfulness: number; // semantic quality 0-1
  };
}

const DEOBFUSCATION_TEST_CASES: DeobfuscationTestCase[] = [
  {
    name: "Simple String Chunking Function",
    difficulty: "easy",
    minifiedCode: `function a(e,t){var n=[];var r=e.length;var i=0;for(;i<r;i+=t){if(i+t<r){n.push(e.substring(i,i+t))}else{n.push(e.substring(i,r))}}return n}`,
    expectedVariables: [
      { minified: "a", expectedSemantic: "splitString|chunkString|splitStringByLength", purpose: "main function" },
      { minified: "e", expectedSemantic: "input|inputString|str|string", purpose: "input parameter" },
      { minified: "t", expectedSemantic: "length|chunkSize|substringLength|size", purpose: "chunk size parameter" },
      { minified: "n", expectedSemantic: "result|chunks|substrings|array", purpose: "result array" },
      { minified: "r", expectedSemantic: "inputLength|stringLength|totalLength", purpose: "string length" },
      { minified: "i", expectedSemantic: "index|currentIndex|position|i", purpose: "loop counter" }
    ],
    qualityThresholds: {
      completeness: 1.0, // All variables must be renamed
      consistency: 1.0,  // Perfect consistency expected
      meaningfulness: 0.8 // High semantic quality expected
    }
  },
  {
    name: "Array Processing with Callback",
    difficulty: "medium", 
    minifiedCode: `function a(e,t){var n=[];for(var r=0;r<e.length;r++){var i=e[r];var o=t(i,r);if(o!==undefined){n.push(o)}}return n}`,
    expectedVariables: [
      { minified: "a", expectedSemantic: "map|transform|process|mapArray", purpose: "array transformation function" },
      { minified: "e", expectedSemantic: "array|inputArray|items|list", purpose: "input array" },
      { minified: "t", expectedSemantic: "callback|transformer|fn|processor", purpose: "transformation function" },
      { minified: "n", expectedSemantic: "result|output|transformed|mapped", purpose: "result array" },
      { minified: "r", expectedSemantic: "index|i|idx", purpose: "loop index" },
      { minified: "i", expectedSemantic: "item|element|current|value", purpose: "current array item" },
      { minified: "o", expectedSemantic: "transformed|result|processed|mapped", purpose: "transformed value" }
    ],
    qualityThresholds: {
      completeness: 1.0,
      consistency: 0.95,
      meaningfulness: 0.75
    }
  },
  {
    name: "Complex Object Manipulation",
    difficulty: "hard",
    minifiedCode: `function a(e,t){var n={};for(var r in e){var i=e[r];var o=t.hasOwnProperty(r)?t[r]:r;var u=typeof i==="object"&&i!==null?a(i,t):i;n[o]=u}return n}`,
    expectedVariables: [
      { minified: "a", expectedSemantic: "transformKeys|mapObject|renameKeys|transformObject", purpose: "recursive object transformation" },
      { minified: "e", expectedSemantic: "obj|object|input|source", purpose: "source object" },
      { minified: "t", expectedSemantic: "mapping|keyMap|transform|keyMapping", purpose: "key mapping object" },
      { minified: "n", expectedSemantic: "result|output|transformed|newObj", purpose: "result object" },
      { minified: "r", expectedSemantic: "key|prop|property", purpose: "object key" },
      { minified: "i", expectedSemantic: "value|val|propValue", purpose: "property value" },
      { minified: "o", expectedSemantic: "newKey|mappedKey|targetKey", purpose: "mapped key name" },
      { minified: "u", expectedSemantic: "transformedValue|newValue|processedValue", purpose: "processed value" }
    ],
    qualityThresholds: {
      completeness: 1.0,
      consistency: 0.9,
      meaningfulness: 0.7
    }
  }
];

// Evaluation metrics
interface EvaluationResult {
  testCase: string;
  model: string;
  completenessScore: number;
  consistencyScore: number;
  meaningfulnessScore: number;
  overallScore: number;
  passed: boolean;
  renamedCode: string;
  analysis: string;
}

// Model configurations to test
const MODEL_CONFIGS = [
  { name: "GPT-4.1", model: "gpt-4.1" },
  { name: "GPT-4o", model: "gpt-4o" },
  { name: "GPT-4o-mini", model: "gpt-4o-mini" }
];

describe("🧪 Deobfuscation Quality Evaluation Suite", () => {
  
  test("🚀 GPT-4.1 vs Legacy Models Comparison", async () => {
    if (!process.env.OPENAI_API_KEY) {
      console.log("⚠️ Skipping OpenAI evaluation tests - OPENAI_API_KEY not set");
      return;
    }

    SecureLogger.enableVerbose();
    
    const results: EvaluationResult[] = [];
    
    console.log("\n📊 Running Comprehensive Deobfuscation Evaluation...\n");
    
    for (const testCase of DEOBFUSCATION_TEST_CASES) {
      console.log(`\n🧩 Testing: ${testCase.name} (${testCase.difficulty})`);
      console.log(`📝 Original: ${testCase.minifiedCode.substring(0, 60)}...`);
      
      for (const modelConfig of MODEL_CONFIGS) {
        console.log(`\n🤖 Model: ${modelConfig.name}`);
        
        try {
          const renamePlugin = openaiRename({
            apiKey: process.env.OPENAI_API_KEY!,
            model: modelConfig.model
          });
          
          const startTime = Date.now();
          const renamedCode = await renamePlugin(testCase.minifiedCode);
          const duration = Date.now() - startTime;
          
          console.log(`⏱️ Processing time: ${duration}ms`);
          console.log(`📤 Output: ${renamedCode.substring(0, 80)}...`);
          
          // Evaluate quality
          const evaluation = evaluateDeobfuscation(testCase, renamedCode, modelConfig.name);
          results.push(evaluation);
          
          // Display results
          console.log(`📊 Quality Scores:`);
          console.log(`   • Completeness: ${(evaluation.completenessScore * 100).toFixed(1)}%`);
          console.log(`   • Consistency: ${(evaluation.consistencyScore * 100).toFixed(1)}%`);
          console.log(`   • Meaningfulness: ${(evaluation.meaningfulnessScore * 100).toFixed(1)}%`);
          console.log(`   • Overall: ${(evaluation.overallScore * 100).toFixed(1)}%`);
          console.log(`   • Status: ${evaluation.passed ? "✅ PASSED" : "❌ FAILED"}`);
          
        } catch (error) {
          console.error(`❌ Error testing ${modelConfig.name}: ${error}`);
        }
      }
    }
    
    // Generate comparison report
    generateComparisonReport(results);
    
    // Verify GPT-4.1 shows improvement
    const gpt41Results = results.filter(r => r.model === "GPT-4.1");
    const otherResults = results.filter(r => r.model !== "GPT-4.1");
    
    if (gpt41Results.length > 0 && otherResults.length > 0) {
      const gpt41AvgScore = gpt41Results.reduce((sum, r) => sum + r.overallScore, 0) / gpt41Results.length;
      const otherAvgScore = otherResults.reduce((sum, r) => sum + r.overallScore, 0) / otherResults.length;
      
      console.log(`\n🎯 GPT-4.1 average score: ${(gpt41AvgScore * 100).toFixed(1)}%`);
      console.log(`🎯 Other models average: ${(otherAvgScore * 100).toFixed(1)}%`);
      console.log(`📈 Improvement: ${((gpt41AvgScore - otherAvgScore) * 100).toFixed(1)}%`);
      
      // Assert that GPT-4.1 performs better
      assert(gpt41AvgScore > otherAvgScore, 
        `GPT-4.1 should outperform other models. GPT-4.1: ${gpt41AvgScore}, Others: ${otherAvgScore}`);
    }
  });
  
  test("🔍 Variable Completeness Evaluation", async () => {
    if (!process.env.OPENAI_API_KEY) return;
    
    const testCase = DEOBFUSCATION_TEST_CASES[0]; // Simple test case
    const renamePlugin = openaiRename({
      apiKey: process.env.OPENAI_API_KEY!,
      model: "gpt-4.1"
    });
    
    const result = await renamePlugin(testCase.minifiedCode);
    
    // Check that all minified variables are replaced
    const minifiedVars = testCase.expectedVariables.map(v => v.minified);
    const stillMinified = minifiedVars.filter(varName => 
      new RegExp(`\\b${varName}\\b`).test(result) && 
      !isAcceptableVariable(varName) // Allow 'i' for loop counters
    );
    
    console.log(`🔍 Original variables: ${minifiedVars.join(', ')}`);
    console.log(`❌ Still minified: ${stillMinified.join(', ') || 'None!'}`);
    
    assert.strictEqual(stillMinified.length, 0, 
      `These variables should be renamed: ${stillMinified.join(', ')}`);
  });
  
  test("🎯 Consistency Verification", async () => {
    if (!process.env.OPENAI_API_KEY) return;
    
    const testCase = DEOBFUSCATION_TEST_CASES[1]; // Medium complexity
    const renamePlugin = openaiRename({
      apiKey: process.env.OPENAI_API_KEY!,
      model: "gpt-4.1"
    });
    
    const result = await renamePlugin(testCase.minifiedCode);
    
    // Extract all identifier mappings from the result
    const variableMappings = extractVariableMappings(testCase.minifiedCode, result);
    
    // Check consistency - same variable should have same name throughout
    for (const [originalVar, renamedInstances] of variableMappings.entries()) {
      const uniqueNames = new Set(renamedInstances);
      
      console.log(`🔄 ${originalVar} → ${Array.from(uniqueNames).join(', ')}`);
      
      assert.strictEqual(uniqueNames.size, 1, 
        `Variable '${originalVar}' should be consistently renamed. Found: ${Array.from(uniqueNames).join(', ')}`);
    }
  });
});

// Evaluation helper functions
function evaluateDeobfuscation(
  testCase: DeobfuscationTestCase, 
  renamedCode: string, 
  model: string
): EvaluationResult {
  
  // Completeness: % of minified variables that were renamed
  const minifiedVars = testCase.expectedVariables.map(v => v.minified);
  const stillMinified = minifiedVars.filter(varName => 
    new RegExp(`\\b${varName}\\b`).test(renamedCode) && 
    !isAcceptableVariable(varName)
  );
  const completenessScore = (minifiedVars.length - stillMinified.length) / minifiedVars.length;
  
  // Consistency: check if same variables have same names throughout
  const mappings = extractVariableMappings(testCase.minifiedCode, renamedCode);
  let consistentVariables = 0;
  
  for (const [, renamedInstances] of mappings.entries()) {
    if (new Set(renamedInstances).size === 1) {
      consistentVariables++;
    }
  }
  const consistencyScore = mappings.size > 0 ? consistentVariables / mappings.size : 0;
  
  // Meaningfulness: semantic quality of variable names
  const meaningfulnessScore = evaluateMeaningfulness(testCase, renamedCode);
  
  // Overall score (weighted average)
  const overallScore = (
    completenessScore * 0.4 + 
    consistencyScore * 0.3 + 
    meaningfulnessScore * 0.3
  );
  
  // Pass/fail based on thresholds
  const passed = (
    completenessScore >= testCase.qualityThresholds.completeness &&
    consistencyScore >= testCase.qualityThresholds.consistency &&
    meaningfulnessScore >= testCase.qualityThresholds.meaningfulness
  );
  
  return {
    testCase: testCase.name,
    model,
    completenessScore,
    consistencyScore,
    meaningfulnessScore,
    overallScore,
    passed,
    renamedCode,
    analysis: `Completeness: ${(completenessScore*100).toFixed(1)}%, Consistency: ${(consistencyScore*100).toFixed(1)}%, Meaningfulness: ${(meaningfulnessScore*100).toFixed(1)}%`
  };
}

function extractVariableMappings(original: string, renamed: string): Map<string, string[]> {
  // This is a simplified approach - in practice, you'd use AST analysis
  const mappings = new Map<string, string[]>();
  
  // Extract identifiers from both versions (simplified)
  const originalIds = original.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g) || [];
  const renamedIds = renamed.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g) || [];
  
  // Basic mapping detection (this is simplified for demo)
  const minifiedVars = [...new Set(originalIds)].filter(id => 
    id.length <= 3 && 
    !['var', 'let', 'const', 'function', 'return', 'if', 'else', 'for', 'while', 'null', 'undefined'].includes(id)
  );
  
  minifiedVars.forEach(varName => {
    // Find what this variable was renamed to (simplified logic)
    const renamedInstances = renamedIds.filter(id => 
      id !== varName && 
      id.length > varName.length
    );
    if (renamedInstances.length > 0) {
      mappings.set(varName, renamedInstances);
    }
  });
  
  return mappings;
}

function evaluateMeaningfulness(testCase: DeobfuscationTestCase, renamedCode: string): number {
  let meaningfulCount = 0;
  let totalExpected = testCase.expectedVariables.length;
  
  testCase.expectedVariables.forEach(expectedVar => {
    // Check if the code contains any of the expected semantic names
    const semanticOptions = expectedVar.expectedSemantic.split('|');
    const hasMeaningfulName = semanticOptions.some(option => 
      new RegExp(`\\b${option}\\b`, 'i').test(renamedCode)
    );
    
    if (hasMeaningfulName) {
      meaningfulCount++;
    }
  });
  
  return totalExpected > 0 ? meaningfulCount / totalExpected : 0;
}

function isAcceptableVariable(varName: string): boolean {
  // Some single-letter variables are acceptable in certain contexts
  return ['i', 'j', 'k'].includes(varName); // Common loop counters
}

function generateComparisonReport(results: EvaluationResult[]): void {
  console.log("\n" + "=".repeat(80));
  console.log("📊 DEOBFUSCATION QUALITY COMPARISON REPORT");
  console.log("=".repeat(80));
  
  const models = [...new Set(results.map(r => r.model))];
  const testCases = [...new Set(results.map(r => r.testCase))];
  
  // Summary table
  console.log("\n📈 Overall Scores by Model:");
  console.log("-".repeat(60));
  
  models.forEach(model => {
    const modelResults = results.filter(r => r.model === model);
    const avgScore = modelResults.reduce((sum, r) => sum + r.overallScore, 0) / modelResults.length;
    const passRate = modelResults.filter(r => r.passed).length / modelResults.length;
    
    console.log(`${model.padEnd(15)} | Score: ${(avgScore * 100).toFixed(1)}% | Pass Rate: ${(passRate * 100).toFixed(1)}%`);
  });
  
  // Detailed breakdown
  console.log("\n📋 Detailed Results:");
  console.log("-".repeat(80));
  
  testCases.forEach(testCase => {
    console.log(`\n🧩 ${testCase}:`);
    
    const testResults = results.filter(r => r.testCase === testCase);
    testResults.forEach(result => {
      console.log(`  ${result.model.padEnd(12)} | ${result.analysis} | ${result.passed ? '✅' : '❌'}`);
    });
  });
  
  console.log("\n" + "=".repeat(80));
} 