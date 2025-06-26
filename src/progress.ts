import { Readable } from "stream";
import { verbose } from "./verbose.js";

export function showProgress(stream: Readable) {
  let bytes = 0;
  let i = 0;
  stream.on("data", (data) => {
    bytes += data.length;
    if (i++ % 1000 !== 0) return;
    process.stdout.clearLine?.(0);
    process.stdout.write(`\rDownloaded ${formatBytes(bytes)}`);
  });
}

function formatBytes(numBytes: number) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;
  while (numBytes > 1024 && unitIndex < units.length) {
    numBytes /= 1024;
    unitIndex++;
  }
  return `${numBytes.toFixed(2)} ${units[unitIndex]}`;
}

export function showPercentage(percentage: number) {
  const percentageStr = Math.round(percentage * 100);
  
  // Skip progress display in test environments or when stdout doesn't support cursor control
  if (process.env.NODE_ENV === 'test' || 
      !process.stdout.isTTY || 
      typeof process.stdout.cursorTo !== 'function') {
    return;
  }
  
  if (!verbose.enabled) {
    try {
      process.stdout.clearLine?.(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`Processing: ${percentageStr}%`);
    } catch {
      // Silently fail if progress display isn't supported
    }
  } else {
    verbose.log(`Processing: ${percentageStr}%`);
  }
  if (percentage === 1) {
    process.stdout.write("\n");
  }
}
