import fs from "node:fs/promises";
import path from "node:path";
import { SecureLogger } from "./security/secure-logger.js";
import { setupProcessingContext, ProcessingContext, isProcessableFile } from "./input-handler.js";
import { webcrack } from "./plugins/webcrack.js";
import { parse } from "@babel/parser";

export async function unminifyEnhanced(
  inputPath: string,
  plugins: ((_code: string) => Promise<string>)[] = [],
  concurrency: number = 1
) {
  try {
    SecureLogger.debug(`Starting enhanced unminification of: ${inputPath}`);
    
    const context = await setupProcessingContext(inputPath);
    
    SecureLogger.debug(`Processing context:`, {
      inputType: context.inputType,
      outputPath: context.outputPath,
      fileCount: context.files.length
    });
    
    if (context.inputType === 'file') {
      await processSingleFile(context, plugins);
    } else {
      await processMultipleFiles(context, plugins, concurrency);
    }
    
    SecureLogger.debug(`Enhanced unminification completed. Output: ${context.outputPath}`);
    
  } catch (error) {
    console.error("Error in unminifyEnhanced:", error);
    throw error;
  }
}

async function processSingleFile(
  context: ProcessingContext,
  plugins: ((_code: string) => Promise<string>)[]
) {
  const filePath = context.files[0];
  SecureLogger.debug(`Processing single file: ${filePath}`);
  
  const code = await fs.readFile(filePath, "utf-8");
  
  if (code.trim().length === 0) {
    SecureLogger.debug(`Skipping empty file ${filePath}`);
    return;
  }
  
  // For single files, check if it's a bundled/minified file that needs webcrack
  let needsWebcrack = false;
  try {
    parse(code, { sourceType: "module", plugins: ["jsx"] });
    // If it parses successfully, check if it looks heavily minified
    needsWebcrack = isHeavilyMinified(code);
  } catch {
    // If it doesn't parse, it might be obfuscated and need webcrack
    needsWebcrack = true;
  }
  
  if (needsWebcrack) {
    SecureLogger.debug("File appears to be bundled/heavily minified, using webcrack");
    await processBundledFile(filePath, plugins);
  } else {
    SecureLogger.debug("File appears to be regular code, processing directly");
    await processRegularFile(filePath, plugins);
  }
}

async function processMultipleFiles(
  context: ProcessingContext,
  plugins: ((_code: string) => Promise<string>)[],
  concurrency: number
) {
  SecureLogger.debug(`Processing ${context.files.length} files with concurrency ${concurrency}`);
  
  const processFile = async (filePath: string, index: number) => {
    try {
      SecureLogger.debug(`Processing file ${index + 1}/${context.files.length}: ${path.basename(filePath)}`);
      
      const code = await fs.readFile(filePath, "utf-8");
      
      if (code.trim().length === 0) {
        SecureLogger.debug(`Skipping empty file ${filePath}`);
        return;
      }
      
      // For files in directories, process them directly (they're usually not bundled)
      await processRegularFile(filePath, plugins);
      
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
  };
  
  // Process files in batches
  const batchSize = Math.ceil(context.files.length / concurrency);
  const batches = [];
  for (let i = 0; i < context.files.length; i += batchSize) {
    batches.push(context.files.slice(i, i + batchSize));
  }
  
  await Promise.all(
    batches.map((batch) =>
      Promise.all(batch.map((filePath, index) => processFile(filePath, index)))
    )
  );
}

async function processBundledFile(
  filePath: string,
  plugins: ((_code: string) => Promise<string>)[]
) {
  const code = await fs.readFile(filePath, "utf-8");
  const outputDir = path.dirname(filePath);
  
  // Use webcrack to extract the bundled file
  const extractedFiles = await webcrack(code, outputDir);
  
  for (let i = 0; i < extractedFiles.length; i++) {
    const file = extractedFiles[i];
    await processRegularFile(file.path, plugins);
  }
  
  // Remove the original copied file since webcrack created the extracted files
  await fs.unlink(filePath);
}

async function processRegularFile(
  filePath: string,
  plugins: ((_code: string) => Promise<string>)[]
) {
  const code = await fs.readFile(filePath, "utf-8");
  let formattedCode = code;
  
  try {
    // Only process files that contain JavaScript-like code
    if (shouldProcessFile(filePath, code)) {
      for (const plugin of plugins) {
        try {
          formattedCode = await plugin(formattedCode);
        } catch (pluginError) {
          console.error(`Error in plugin for file ${filePath}:`, pluginError);
          // Continue with the next plugin
        }
      }
      
      // Attempt to parse the final code for JavaScript files
      if (isJavaScriptFile(filePath)) {
        try {
          parse(formattedCode, { sourceType: "module", plugins: ["jsx"] });
        } catch (parseError) {
          console.error(`Syntax error in file ${filePath} after processing:`, parseError);
          // Revert to the original code if parsing fails
          formattedCode = code;
        }
      }
      
      // Fix invalid escape sequences
      formattedCode = fixInvalidEscapeSequences(formattedCode);
    }
    
    SecureLogger.debug("File processed", {
      inputLength: code.length,
      outputLength: formattedCode.length,
      filePath: path.basename(filePath)
    });
    
    await fs.writeFile(filePath, formattedCode);
    
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

function shouldProcessFile(filePath: string, code: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  
  // Always process JavaScript/TypeScript files
  if (['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'].includes(ext)) {
    return true;
  }
  
  // For HTML files, only process if they contain script tags
  if (['.html', '.htm'].includes(ext)) {
    return code.includes('<script') && code.includes('</script>');
  }
  
  // For Vue/Svelte files, only process if they contain script sections
  if (['.vue', '.svelte'].includes(ext)) {
    return code.includes('<script') || code.includes('export');
  }
  
  // For JSON files, only process if they look like they might be obfuscated
  if (ext === '.json') {
    try {
      JSON.parse(code);
      // If it's valid JSON but has very long lines, it might be minified
      return code.split('\n').some(line => line.length > 200);
    } catch {
      // If it's not valid JSON, it might be obfuscated
      return true;
    }
  }
  
  return false;
}

function isJavaScriptFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'].includes(ext);
}

function isHeavilyMinified(code: string): boolean {
  const lines = code.split('\n');
  
  // Characteristics that suggest this is a bundled file (webpack, etc.) that needs webcrack
  const hasBundleSignatures = [
    /webpack/i,
    /!function\s*\(\s*[a-z]\s*\)/i, // Common webpack wrapper
    /__webpack_require__/i,
    /webpackJsonp/i,
    /!function\s*\(\s*modules?\s*\)/i, // Module bundler pattern
    /\(function\s*\(\s*modules?\s*\)/i, // Alternative module pattern
  ].some(pattern => pattern.test(code));
  
  // If it has bundle signatures, it likely needs webcrack
  if (hasBundleSignatures) {
    return true;
  }
  
  // Check for characteristics of simple minified files (should NOT use webcrack)
  const avgLineLength = code.length / lines.length;
  const hasVeryLongSingleLine = lines.length === 1 && code.length > 500;
  const isSimpleMinified = hasVeryLongSingleLine && !hasBundleSignatures;
  
  // For simple minified files (one long line, no bundle signatures), don't use webcrack
  if (isSimpleMinified) {
    return false;
  }
  
  // Check for truly complex bundled code
  const hasModulePatterns = /\b(?:module|exports|require|define)\b/.test(code);
  const hasMultipleIIFEs = (code.match(/\(function\s*\(/g) || []).length > 2;
  const hasObjectPacking = /\{[^}]{100,}\}/.test(code); // Large packed objects
  
  return hasModulePatterns && (hasMultipleIIFEs || hasObjectPacking) && avgLineLength > 200;
}

function fixInvalidEscapeSequences(code: string): string {
  return code.replace(/\\u([0-9a-fA-F]{0,3}[^0-9a-fA-F])/g, (match, p1) => {
    return `\\u${p1.padStart(4, "0")}`;
  });
} 