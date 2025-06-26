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

// Enhanced progress bar system for concurrent file and overall progress
export class ProgressManager {
  private overallTotal: number = 0;
  private overallCompleted: number = 0;
  private currentFileProgress: number = 0;
  private currentFileName: string = '';
  private isProcessingMultipleFiles: boolean = false;
  private lastDisplayTime: number = 0;
  private readonly throttleMs: number = 50; // Update max every 50ms

  constructor() {
    // Check if progress display is supported
    if (process.env.NODE_ENV === 'test' || 
        !process.stdout.isTTY || 
        typeof process.stdout.cursorTo !== 'function') {
      return;
    }
  }

  private canDisplay(): boolean {
    return process.env.NODE_ENV !== 'test' && 
           process.stdout.isTTY && 
           typeof process.stdout.cursorTo === 'function';
  }

  startMultiFileProcessing(totalFiles: number) {
    this.overallTotal = totalFiles;
    this.overallCompleted = 0;
    this.currentFileProgress = 0;
    this.isProcessingMultipleFiles = true;
    this.update();
  }

  startSingleFileProcessing(fileName: string) {
    this.currentFileName = fileName;
    this.currentFileProgress = 0;
    this.isProcessingMultipleFiles = false;
    this.update();
  }

  setCurrentFile(fileName: string) {
    this.currentFileName = fileName;
    this.currentFileProgress = 0;
    this.update();
  }

  updateCurrentFileProgress(progress: number) {
    // Throttle updates to avoid excessive output
    const now = Date.now();
    if (now - this.lastDisplayTime < this.throttleMs && progress < 1) {
      return;
    }
    this.lastDisplayTime = now;

    this.currentFileProgress = Math.max(0, Math.min(1, progress));
    this.update();
  }

  completeCurrentFile() {
    this.currentFileProgress = 1;
    this.overallCompleted++;
    this.update();
    
    // Add a small delay to show completion before moving to next file
    if (this.canDisplay() && !verbose.enabled) {
      setTimeout(() => {
        this.currentFileProgress = 0;
        this.update();
      }, 100);
    }
  }

  finish() {
    if (!this.canDisplay()) return;

    this.currentFileProgress = 1;
    this.overallCompleted = this.overallTotal;
    this.update();
    
    if (!verbose.enabled) {
      // Clear the progress lines and show completion
      try {
        process.stdout.write('\r\x1b[K'); // Clear current line
        if (this.isProcessingMultipleFiles) {
          process.stdout.write('\x1b[1A\r\x1b[K'); // Move up and clear overall progress line
        }
        
        const message = this.isProcessingMultipleFiles 
          ? `✅ Completed processing ${this.overallTotal} files`
          : `✅ Completed processing ${this.currentFileName}`;
        
        console.log(message);
      } catch {
        // Silently fail if cursor control isn't supported
      }
    } else {
      const message = this.isProcessingMultipleFiles 
        ? `Completed processing ${this.overallTotal} files`
        : `Completed processing ${this.currentFileName}`;
      verbose.log(message);
    }
  }

  private update() {
    if (!this.canDisplay() || verbose.enabled) {
      if (verbose.enabled) {
        this.logVerboseProgress();
      }
      return;
    }

    try {
      if (this.isProcessingMultipleFiles) {
        this.displayMultiFileProgress();
      } else {
        this.displaySingleFileProgress();
      }
    } catch {
      // Silently fail if progress display isn't supported
    }
  }

  private displayMultiFileProgress() {
    const overallPercent = this.overallTotal > 0 ? Math.round((this.overallCompleted / this.overallTotal) * 100) : 0;
    const currentPercent = Math.round(this.currentFileProgress * 100);
    
    const overallBar = this.createProgressBar(this.overallCompleted, this.overallTotal, 30);
    const currentBar = this.createProgressBar(this.currentFileProgress, 1, 20);
    
    const fileName = this.currentFileName ? ` ${this.truncateFileName(this.currentFileName)}` : '';
    
    // Save cursor position, then draw two lines
    process.stdout.write('\x1b[s'); // Save cursor
    
    // Overall progress (first line)
    process.stdout.write(`\r\x1b[K📁 Overall: [${overallBar}] ${overallPercent}% (${this.overallCompleted}/${this.overallTotal})`);
    
    // Current file progress (second line)
    process.stdout.write(`\n\r\x1b[K📄 Current: [${currentBar}] ${currentPercent}%${fileName}`);
    
    // Restore cursor position
    process.stdout.write('\x1b[u'); // Restore cursor
  }

  private displaySingleFileProgress() {
    const currentPercent = Math.round(this.currentFileProgress * 100);
    const currentBar = this.createProgressBar(this.currentFileProgress, 1, 40);
    const fileName = this.currentFileName ? ` ${this.truncateFileName(this.currentFileName)}` : '';
    
    process.stdout.write(`\r\x1b[K🔄 Processing: [${currentBar}] ${currentPercent}%${fileName}`);
  }

  private logVerboseProgress() {
    if (this.isProcessingMultipleFiles) {
      const overallPercent = this.overallTotal > 0 ? Math.round((this.overallCompleted / this.overallTotal) * 100) : 0;
      const currentPercent = Math.round(this.currentFileProgress * 100);
      verbose.log(`Overall: ${overallPercent}% (${this.overallCompleted}/${this.overallTotal}) | Current file: ${currentPercent}% ${this.currentFileName}`);
    } else {
      const currentPercent = Math.round(this.currentFileProgress * 100);
      verbose.log(`Processing: ${currentPercent}% ${this.currentFileName}`);
    }
  }

  private createProgressBar(current: number, total: number, width: number): string {
    const progress = total > 0 ? current / total : 0;
    const filledWidth = Math.round(progress * width);
    const emptyWidth = width - filledWidth;
    
    const filled = '█'.repeat(filledWidth);
    const empty = '░'.repeat(emptyWidth);
    
    return filled + empty;
  }

  private truncateFileName(fileName: string, maxLength: number = 35): string {
    if (fileName.length <= maxLength) return fileName;
    return '...' + fileName.slice(-(maxLength - 3));
  }
}

// Global progress manager instance
export const progressManager = new ProgressManager();
