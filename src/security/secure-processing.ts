import { Worker } from "worker_threads";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomBytes } from "crypto";
import { SecurityError } from "./input-validator.js";
import { SecureLogger } from "./secure-logger.js";

const PROCESSING_TIMEOUT = 30000; // 30 seconds
const MAX_MEMORY_MB = 200; // Maximum memory per worker

/**
 * Secure code processing with sandboxing and resource limits
 */
export class SecureCodeProcessor {
  /**
   * Process code in a sandboxed worker thread with resource limits
   */
  static async processCodeSecurely(
    code: string,
    processingFunction: string,
    options: ProcessingOptions = {}
  ): Promise<string> {
    const timeout = options.timeoutMs || PROCESSING_TIMEOUT;
    const maxMemory = options.maxMemoryMb || MAX_MEMORY_MB;

    // Validate input size
    if (code.length > 10 * 1024 * 1024) {
      // 10MB limit
      throw new SecurityError("Code input too large for secure processing");
    }

    // Check for dangerous patterns in code
    this.validateCodeSafety(code);

    // Create temporary worker script
    const workerId = randomBytes(16).toString("hex");
    const workerPath = join(tmpdir(), `secure-worker-${workerId}.js`);

    try {
      // Create isolated worker script
      const workerScript = this.createWorkerScript(processingFunction);
      writeFileSync(workerPath, workerScript);

      return await this.executeInWorker(workerPath, code, timeout, maxMemory);
    } finally {
      // Clean up temporary files
      try {
        unlinkSync(workerPath);
      } catch (error) {
        SecureLogger.warn("Failed to clean up worker file", {
          error,
          workerPath
        });
      }
    }
  }

  /**
   * Validates code for obviously dangerous patterns
   */
  private static validateCodeSafety(code: string): void {
    const dangerousPatterns = [
      /require\s*\(\s*['"]child_process['"]\s*\)/, // Process execution
      /spawn\s*\(/, // Process spawning
      /exec\s*\(/, // Process execution
      /eval\s*\(\s*['"]/, // Eval with string literals (suspicious)
      /new\s+Function\s*\(\s*['"]/, // Function constructor with strings
      /document\.write\s*\(/, // DOM manipulation in server context
      /window\.location\s*=/, // Navigation manipulation
      /XMLHttpRequest\s*\(/, // Direct network requests
      /fetch\s*\(\s*['"]\//, // Absolute URL fetches
      /\.innerHTML\s*=.*script/, // Script injection via innerHTML
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        throw new SecurityError(
          `Code contains potentially dangerous pattern: ${pattern.source}`
        );
      }
    }
  }

  /**
   * Creates a secure worker script with limited capabilities
   */
  private static createWorkerScript(processingFunction: string): string {
    return `
const { parentPort, workerData } = require('worker_threads');

// Disable dangerous globals
global.require = undefined;
global.process = {
  env: {}, // Only empty env
  version: process.version,
  versions: process.versions
};
global.__dirname = undefined;
global.__filename = undefined;

// Processing function
${processingFunction}

try {
  const result = processCode(workerData.code);
  parentPort.postMessage({ success: true, result });
} catch (error) {
  parentPort.postMessage({ 
    success: false, 
    error: error.message,
    name: error.name 
  });
}
`;
  }

  /**
   * Execute code in a worker thread with resource limits
   */
  private static async executeInWorker(
    workerPath: string,
    code: string,
    timeout: number,
    maxMemory: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(workerPath, {
        workerData: { code },
        resourceLimits: {
          maxOldGenerationSizeMb: maxMemory,
          maxYoungGenerationSizeMb: Math.floor(maxMemory / 4),
          codeRangeSizeMb: Math.floor(maxMemory / 10)
        }
      });

      const timeoutHandle = setTimeout(() => {
        worker.terminate();
        reject(new SecurityError("Code processing timeout exceeded"));
      }, timeout);

      worker.on("message", (message) => {
        clearTimeout(timeoutHandle);

        if (message.success) {
          resolve(message.result);
        } else {
          reject(new SecurityError(`Code processing failed: ${message.error}`));
        }
      });

      worker.on("error", (error) => {
        clearTimeout(timeoutHandle);
        reject(new SecurityError(`Worker error: ${error.message}`));
      });

      worker.on("exit", (code) => {
        clearTimeout(timeoutHandle);
        if (code !== 0) {
          reject(new SecurityError(`Worker exited with code ${code}`));
        }
      });
    });
  }
}

export interface ProcessingOptions {
  timeoutMs?: number;
  maxMemoryMb?: number;
}

/**
 * Secure Babel transformation function for worker
 */
export const SECURE_BABEL_PROCESSOR = `
const babel = require('@babel/core');

function processCode(code) {
  const result = babel.transformSync(code, {
    plugins: [], // Only safe plugins allowed
    compact: false,
    minified: false,
    comments: false,
    sourceMaps: false,
    retainLines: false,
    // Security: Disable dangerous options
    parserOpts: {
      strictMode: true,
      allowImportExportEverywhere: false,
      allowAwaitOutsideFunction: false,
      allowReturnOutsideFunction: false,
      allowSuperOutsideMethod: false,
      allowUndeclaredExports: false
    }
  });
  
  if (!result || !result.code) {
    throw new Error('Babel transformation failed');
  }
  
  return result.code;
}
`;
