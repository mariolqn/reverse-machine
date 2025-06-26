import fs from "node:fs/promises";
import path from "node:path";
import { SecureLogger } from "./security/secure-logger.js";
import { validateInputFile, validateOutputPath } from "./security/input-validator.js";

export interface ProcessingContext {
  inputPath: string;
  outputPath: string;
  inputType: 'file' | 'directory' | 'zip';
  files: string[];
}

export async function determineInputType(inputPath: string): Promise<'file' | 'directory' | 'zip'> {
  const stats = await fs.stat(inputPath);
  
  if (stats.isDirectory()) {
    return 'directory';
  } else if (stats.isFile()) {
    const ext = path.extname(inputPath).toLowerCase();
    if (ext === '.zip') {
      return 'zip';
    }
    return 'file';
  }
  
  throw new Error(`Invalid input: ${inputPath} is neither a file nor a directory`);
}

export async function setupProcessingContext(inputPath: string): Promise<ProcessingContext> {
  const validatedInput = validateInputFile(inputPath);
  const inputType = await determineInputType(validatedInput);
  
  let outputPath: string;
  let files: string[];
  
  switch (inputType) {
    case 'file': {
      outputPath = await handleSingleFile(validatedInput);
      files = [outputPath];
      break;
    }
    case 'directory': {
      outputPath = await handleDirectory(validatedInput);
      files = await getAllProcessableFiles(outputPath);
      break;
    }
    case 'zip': {
      outputPath = await handleZipFile(validatedInput);
      files = await getAllProcessableFiles(outputPath);
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

async function handleSingleFile(filePath: string): Promise<string> {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const basename = path.basename(filePath, ext);
  
  const outputPath = path.join(dir, `${basename} - Deobfuscated${ext}`);
  
  SecureLogger.debug(`Copying single file: ${filePath} -> ${outputPath}`);
  await fs.copyFile(filePath, outputPath);
  
  return outputPath;
}

async function handleDirectory(dirPath: string): Promise<string> {
  const parentDir = path.dirname(dirPath);
  const basename = path.basename(dirPath);
  
  const outputPath = path.join(parentDir, `${basename}-deobfuscated`);
  
  SecureLogger.debug(`Copying directory: ${dirPath} -> ${outputPath}`);
  await copyDirectoryRecursive(dirPath, outputPath);
  
  return outputPath;
}

async function handleZipFile(zipPath: string): Promise<string> {
  // For now, we'll require users to have unzip available
  // In the future, we could add a ZIP library dependency
  const parentDir = path.dirname(zipPath);
  const basename = path.basename(zipPath, '.zip');
  
  const extractPath = path.join(parentDir, `${basename}-extracted`);
  const outputPath = path.join(parentDir, `${basename}-deobfuscated`);
  
  SecureLogger.debug(`Extracting ZIP: ${zipPath} -> ${extractPath}`);
  
  try {
    // Create extraction directory
    await fs.mkdir(extractPath, { recursive: true });
    
    // Use system unzip command (available on most Unix systems)
    const { exec } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execAsync = promisify(exec);
    
    await execAsync(`unzip -q "${zipPath}" -d "${extractPath}"`);
    
    SecureLogger.debug(`Copying extracted content: ${extractPath} -> ${outputPath}`);
    await copyDirectoryRecursive(extractPath, outputPath);
    
    // Clean up extraction directory
    await fs.rm(extractPath, { recursive: true, force: true });
    
    return outputPath;
  } catch (error) {
    SecureLogger.debug(`Failed to extract ZIP with system unzip, trying manual extraction`);
    throw new Error(`Failed to extract ZIP file: ${error}. Please ensure 'unzip' command is available or extract manually.`);
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
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function getAllProcessableFiles(dirPath: string): Promise<string[]> {
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

function isProcessableFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  const processableExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
    '.vue', '.svelte', // Component files that might contain JS
    '.html', '.htm', // HTML files might contain inline JS
    '.json' // Configuration files might be obfuscated
  ];
  
  return processableExtensions.includes(ext);
}

export { isProcessableFile }; 