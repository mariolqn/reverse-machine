import path from "path";
import fs from "fs";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_DIRECTORY_SIZE = 500 * 1024 * 1024; // 500MB for directories
const ALLOWED_FILE_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".min.js"];
const ALLOWED_ARCHIVE_EXTENSIONS = [".zip"];

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SecurityError";
  }
}

/**
 * Validates input path (file, directory, or ZIP) and prevents path traversal attacks
 */
export function validateInputFile(inputPath: string): string {
  if (!inputPath || typeof inputPath !== "string") {
    throw new SecurityError("Invalid input path provided");
  }

  // Resolve to absolute path to prevent traversal
  const absolutePath = path.resolve(inputPath);
  const workingDir = process.cwd();

  // Prevent path traversal outside working directory or user home
  const userHome = process.env.HOME || process.env.USERPROFILE || "";
  const isInWorkingDir = absolutePath.startsWith(workingDir);
  const isInUserHome = userHome && absolutePath.startsWith(userHome);

  if (!isInWorkingDir && !isInUserHome) {
    throw new SecurityError(
      "Path traversal detected - input must be within working directory or user home"
    );
  }

  // Check if path exists AFTER security validation
  if (!fs.existsSync(absolutePath)) {
    throw new SecurityError(`Path not found: ${inputPath}`);
  }

  const stats = fs.statSync(absolutePath);

  if (stats.isFile()) {
    return validateFile(absolutePath, stats);
  } else if (stats.isDirectory()) {
    return validateDirectory(absolutePath);
  } else {
    throw new SecurityError("Path must be a regular file or directory");
  }
}

function validateFile(filePath: string, stats: fs.Stats): string {
  // Validate file extension
  const extension = path.extname(filePath).toLowerCase();
  const allAllowedExtensions = [...ALLOWED_FILE_EXTENSIONS, ...ALLOWED_ARCHIVE_EXTENSIONS];
  
  if (!allAllowedExtensions.includes(extension)) {
    throw new SecurityError(
      `Invalid file type. Allowed extensions: ${allAllowedExtensions.join(", ")}`
    );
  }

  // Check file size to prevent DoS
  if (stats.size > MAX_FILE_SIZE) {
    throw new SecurityError(
      `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }

  return filePath;
}

function validateDirectory(dirPath: string): string {
  // Check total directory size to prevent DoS
  const totalSize = calculateDirectorySize(dirPath);
  if (totalSize > MAX_DIRECTORY_SIZE) {
    throw new SecurityError(
      `Directory too large. Maximum size: ${MAX_DIRECTORY_SIZE / 1024 / 1024}MB`
    );
  }

  // Ensure directory contains processable files
  const hasProcessableFiles = containsProcessableFiles(dirPath);
  if (!hasProcessableFiles) {
    throw new SecurityError(
      `Directory must contain at least one processable file (${ALLOWED_FILE_EXTENSIONS.join(", ")})`
    );
  }

  return dirPath;
}

function calculateDirectorySize(dirPath: string): number {
  let totalSize = 0;
  
  function scanDirectory(currentPath: string): void {
    try {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          scanDirectory(fullPath);
        } else if (entry.isFile()) {
          const stats = fs.statSync(fullPath);
          totalSize += stats.size;
          
          // Early exit if size limit exceeded
          if (totalSize > MAX_DIRECTORY_SIZE) {
            return;
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  scanDirectory(dirPath);
  return totalSize;
}

function containsProcessableFiles(dirPath: string): boolean {
  function scanDirectory(currentPath: string): boolean {
    try {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          if (scanDirectory(fullPath)) {
            return true;
          }
        } else if (entry.isFile()) {
          const extension = path.extname(entry.name).toLowerCase();
          if (ALLOWED_FILE_EXTENSIONS.includes(extension)) {
            return true;
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
    
    return false;
  }
  
  return scanDirectory(dirPath);
}

/**
 * Validates and secures output directory path
 */
export function validateOutputPath(outputDir: string): string {
  if (!outputDir || typeof outputDir !== "string") {
    throw new SecurityError("Invalid output directory provided");
  }

  const resolved = path.resolve(outputDir);
  const workingDir = process.cwd();

  // Ensure output is within working directory or a safe subdirectory
  if (!resolved.startsWith(workingDir)) {
    throw new SecurityError(
      "Output directory must be within working directory"
    );
  }

  // Prevent dangerous directory names (must be exact matches or immediate subdirectories)
  const dangerousPaths = [
    "/etc",
    "/usr",
    "/var", 
    "/bin",
    "/sbin",
    "/boot",
    "/sys",
    "/proc",
    "/dev"
  ];
  
  // Check if the resolved path is exactly a dangerous directory or immediate child
  const isDangerous = dangerousPaths.some((dangerous) => {
    return resolved === dangerous || resolved.startsWith(dangerous + "/");
  });
  
  if (isDangerous) {
    throw new SecurityError(
      "Output directory not allowed in system directories"
    );
  }

  // Create directory with restricted permissions
  try {
    fs.mkdirSync(resolved, {
      recursive: true,
      mode: 0o755
    });
  } catch (error) {
    throw new SecurityError(
      `Failed to create output directory: ${(error as Error).message}`
    );
  }

  return resolved;
}

/**
 * Sanitizes filename for safe file operations
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, "_") // Replace dangerous characters
    .replace(/\.\./g, "_") // Replace path traversal attempts
    .replace(/^\.+/, "_") // Replace leading dots
    .trim();
}
