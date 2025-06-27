import { transform, PluginItem } from "@babel/core";
import { SecurityError } from "./security/input-validator.js";
import { SecureLogger } from "./security/secure-logger.js";

const MAX_CODE_SIZE = 50 * 1024 * 1024; // 50MB limit for code processing

export const transformWithPlugins = async (
  code: string,
  plugins: PluginItem[]
): Promise<string> => {
  // Security: Validate input size
  if (code.length > MAX_CODE_SIZE) {
    throw new SecurityError(
      `Code too large for processing. Maximum size: ${MAX_CODE_SIZE / 1024 / 1024}MB`
    );
  }

  // Security: Check for dangerous patterns
  validateCodeSafety(code);

  return await new Promise((resolve, reject) =>
    transform(
      code,
      {
        plugins,
        compact: false,
        minified: false,
        comments: false,
        sourceMaps: false,
        retainLines: false,
        // Security: Strict parsing options
        parserOpts: {
          strictMode: true,
          allowImportExportEverywhere: false,
          allowAwaitOutsideFunction: false,
          allowReturnOutsideFunction: false,
          allowSuperOutsideMethod: false,
          allowUndeclaredExports: false
        },
        // Security: Disable potentially dangerous options
        auxiliaryCommentBefore: undefined,
        auxiliaryCommentAfter: undefined,
        shouldPrintComment: undefined
      },
      (err, result) => {
        if (err || !result) {
          SecureLogger.error("Babel transformation failed", {
            error: err?.message
          });
          reject(err || new SecurityError("Babel transformation failed"));
        } else {
          SecureLogger.debug("Babel transformation completed", {
            inputSize: code.length,
            outputSize: result.code?.length || 0
          });
          resolve(result.code as string);
        }
      }
    )
  );
};

/**
 * Validates code for obviously dangerous patterns that could be exploited
 */
function validateCodeSafety(code: string): void {
  const dangerousPatterns = [
    // Direct dangerous system access
    /require\s*\(\s*['"]child_process['"]\s*\)\s*\.\s*exec/,
    /require\s*\(\s*['"]child_process['"]\s*\)\s*\.\s*spawn/,
    
    // Code execution that looks malicious
    /eval\s*\(\s*['"`][^'"`]*(?:script|exec|system)[^'"`]*['"`]/,
    /new\s+Function\s*\(\s*['"][^'"]*(?:script|exec|system)[^'"]*['"]\s*\)/,
    /setTimeout\s*\(\s*['"][^'"]*(?:script|exec|system)[^'"]*['"]/,
    /setInterval\s*\(\s*['"][^'"]*(?:script|exec|system)[^'"]*['"]/,

    // Obvious attacks
    /document\.write\s*\(\s*['"]<script/i,
    /window\.location\s*=\s*['"]javascript:/,
    /innerHTML\s*=\s*['"][^'"]*<script/i,
    
    // Suspicious imports that would be dangerous in our context
    /import\s+.*['"]child_process['"].*\.\s*exec/,
    /import\s+.*['"]vm['"].*\.\s*runInNewContext/
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      throw new SecurityError(
        `Code contains potentially dangerous pattern: ${pattern.source}`
      );
    }
  }

  // Check for excessive complexity that might be a DoS attempt
  const lines = code.split("\n");
  if (lines.length > 100000) {
    throw new SecurityError("Code has too many lines (potential DoS attempt)");
  }

  // Check for deeply nested structures
  const maxNesting = 50;
  let currentNesting = 0;
  let maxFound = 0;

  for (const char of code) {
    if (char === "{" || char === "(" || char === "[") {
      currentNesting++;
      maxFound = Math.max(maxFound, currentNesting);
    } else if (char === "}" || char === ")" || char === "]") {
      currentNesting--;
    }
  }

  if (maxFound > maxNesting) {
    throw new SecurityError(
      `Code has excessive nesting depth: ${maxFound} (max: ${maxNesting})`
    );
  }
}
