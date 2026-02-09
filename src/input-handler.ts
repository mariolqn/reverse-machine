import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { SecureLogger } from "./security/secure-logger.js";
import {
  SecurityError,
  validateInputFile,
  validateOutputPath
} from "./security/input-validator.js";

const execFileAsync = promisify(execFile);
const ZIP_EXEC_MAX_BUFFER = 1024 * 1024 * 200; // 200MB

export interface ProcessingContext {
  inputPath: string;
  outputPath: string;
  inputType: "file" | "directory" | "zip";
  files: string[];
}

export interface ProcessingContextOptions {
  outputDir?: string;
}

export async function determineInputType(
  inputPath: string
): Promise<"file" | "directory" | "zip"> {
  const stats = await fs.stat(inputPath);

  if (stats.isDirectory()) {
    return "directory";
  }

  if (stats.isFile()) {
    const ext = path.extname(inputPath).toLowerCase();
    if (ext === ".zip") {
      return "zip";
    }
    return "file";
  }

  throw new Error(`Invalid input: ${inputPath} is neither a file nor a directory`);
}

export async function setupProcessingContext(
  inputPath: string,
  options: ProcessingContextOptions = {}
): Promise<ProcessingContext> {
  const validatedInput = validateInputFile(inputPath);
  const inputType = await determineInputType(validatedInput);

  let outputPath: string;
  let files: string[];

  switch (inputType) {
    case "file": {
      outputPath = await handleSingleFile(validatedInput, options.outputDir);
      files = [outputPath];
      break;
    }
    case "directory": {
      outputPath = await handleDirectory(validatedInput, options.outputDir);
      files = await collectProcessableFiles(outputPath);
      break;
    }
    case "zip": {
      outputPath = await handleZipFile(validatedInput, options.outputDir);
      files = await collectProcessableFiles(outputPath);
      break;
    }
    default:
      throw new Error(`Unsupported input type: ${inputType}`);
  }

  return {
    inputPath: validatedInput,
    outputPath,
    inputType,
    files
  };
}

async function handleSingleFile(
  filePath: string,
  outputDir?: string
): Promise<string> {
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);

  let outputPath: string;
  if (outputDir) {
    const validatedOutputDir = validateOutputPath(outputDir);
    outputPath = path.join(validatedOutputDir, `deobfuscated${ext}`);
  } else {
    const dir = path.dirname(filePath);
    outputPath = path.join(dir, `${baseName} - Deobfuscated${ext}`);
  }

  SecureLogger.debug(`Copying single file: ${filePath} -> ${outputPath}`);
  await fs.copyFile(filePath, outputPath);

  return outputPath;
}

async function handleDirectory(
  dirPath: string,
  outputDir?: string
): Promise<string> {
  const outputPath = outputDir
    ? validateOutputPath(outputDir)
    : path.join(path.dirname(dirPath), `${path.basename(dirPath)}-deobfuscated`);

  SecureLogger.debug(`Copying directory: ${dirPath} -> ${outputPath}`);
  await copyDirectoryRecursive(dirPath, outputPath);

  return outputPath;
}

async function handleZipFile(zipPath: string, outputDir?: string): Promise<string> {
  const baseName = path.basename(zipPath, ".zip");
  const outputPath = outputDir
    ? validateOutputPath(outputDir)
    : path.join(path.dirname(zipPath), `${baseName}-deobfuscated`);

  const extractPath = path.join(
    tmpdir(),
    `reverse-machine-extract-${baseName}-${randomUUID()}`
  );

  SecureLogger.debug(`Extracting ZIP: ${zipPath} -> ${extractPath}`);

  try {
    const entries = await listZipEntries(zipPath);
    validateZipEntries(entries);

    await fs.mkdir(extractPath, { recursive: true });
    await execFileAsync("unzip", ["-q", zipPath, "-d", extractPath], {
      maxBuffer: ZIP_EXEC_MAX_BUFFER
    });

    SecureLogger.debug(`Copying extracted content: ${extractPath} -> ${outputPath}`);
    await copyDirectoryRecursive(extractPath, outputPath);
    return outputPath;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new SecurityError(
      `Failed to extract ZIP file securely: ${detail}. Ensure 'unzip' is installed.`
    );
  } finally {
    await fs.rm(extractPath, { recursive: true, force: true });
  }
}

function validateZipEntries(entries: string[]): void {
  for (const entry of entries) {
    if (entry.trim().length === 0 || entry.endsWith("/")) {
      continue;
    }

    const normalized = path.posix.normalize(entry);
    if (
      normalized.startsWith("../") ||
      normalized.includes("/../") ||
      path.posix.isAbsolute(normalized)
    ) {
      throw new SecurityError(`ZIP contains unsafe path entry: ${entry}`);
    }
  }
}

async function copyDirectoryRecursive(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectoryRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

export async function collectProcessableFiles(dirPath: string): Promise<string[]> {
  const files: string[] = [];

  async function scanDirectory(currentPath: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (entry.isFile() && isProcessableFile(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  await scanDirectory(dirPath);
  return files;
}

export async function listZipEntries(zipPath: string): Promise<string[]> {
  const { stdout } = await execFileAsync("unzip", ["-Z1", zipPath], {
    maxBuffer: ZIP_EXEC_MAX_BUFFER
  });

  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export async function readZipEntryText(
  zipPath: string,
  entryPath: string
): Promise<string> {
  const normalized = path.posix.normalize(entryPath);
  if (
    normalized.startsWith("../") ||
    normalized.includes("/../") ||
    path.posix.isAbsolute(normalized)
  ) {
    throw new SecurityError(`Unsafe ZIP entry path: ${entryPath}`);
  }

  const { stdout } = await execFileAsync("unzip", ["-p", zipPath, entryPath], {
    encoding: "utf-8",
    maxBuffer: ZIP_EXEC_MAX_BUFFER
  });
  return stdout;
}

function isProcessableFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  const processableExtensions = [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".mjs",
    ".cjs",
    ".vue",
    ".svelte",
    ".html",
    ".htm",
    ".json"
  ];
  return processableExtensions.includes(ext);
}

export { isProcessableFile };
