import assert from "assert";
import { spawn } from "child_process";

/**
 * Check if system has enough resources for intensive tests
 */
export function shouldSkipResourceIntensiveTests(): boolean {
  const memoryUsage = process.memoryUsage();
  const freeMemory = process.env.NODE_OPTIONS?.includes('--max-old-space-size') 
    ? parseInt(process.env.NODE_OPTIONS.match(/--max-old-space-size=(\d+)/)?.[1] || '4096')
    : 4096; // Default Node.js heap size in MB
  
  // Skip if we're already using > 50% of available memory
  const memoryUsagePercent = (memoryUsage.heapUsed / (freeMemory * 1024 * 1024)) * 100;
  
  return memoryUsagePercent > 50;
}

import { verbose } from "./verbose.js";

export function assertMatches(actual: string, expected: string[]) {
  assert(
    expected.some((str) => actual.toLowerCase().includes(str.toLowerCase())),
    `Expected ${actual} to be one of ${JSON.stringify(expected)}`
  );
}

export async function reverseMachine(...argv: string[]) {
  const process = spawn("./dist/index.mjs", argv);
  const stdout: string[] = [];
  const stderr: string[] = [];
  process.stdout.on("data", (data) => stdout.push(data.toString()));
  process.stderr.on("data", (data) => stderr.push(data.toString()));
  
  // Add timeout protection to prevent hanging
  const timeout = setTimeout(() => {
    process.kill('SIGTERM');
    setTimeout(() => process.kill('SIGKILL'), 5000); // Force kill after 5s
  }, 60000); // 60 second timeout
  
  await new Promise((resolve, reject) =>
    process.on("close", () => {
      clearTimeout(timeout);
      if (process.exitCode === 0) {
        resolve(undefined);
      } else {
        reject(
          new Error(
            `Process exited with code ${process.exitCode}, stderr: ${stderr.join("")}, stdout: ${stdout.join("")}`
          )
        );
      }
    })
  );
  verbose.log("stdout", stdout.join(""));
  verbose.log("stderr", stderr.join(""));

  return { stdout: stdout.join(""), stderr: stderr.join("") };
}

export function ensure<T>(
  value: NonNullable<T> | undefined | null,
  message: string = "Value was null or undeined"
): NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(message);
  }
  return value;
}
