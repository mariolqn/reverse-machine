import path from "path";
import fs from "fs";
import { err } from "../cli-error.js";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_EXTENSIONS = [".js", ".mjs", ".min.js", ".ts"];

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SecurityError";
  }
}

/**
 * Validates input file path and prevents path traversal attacks
 */
export function validateInputFile(filename: string): string {
  if (!filename || typeof filename !== "string") {
    throw new SecurityError("Invalid filename provided");
  }

  // Resolve to absolute path to prevent traversal
  const absolutePath = path.resolve(filename);
  const workingDir = process.cwd();

  // Prevent path traversal outside working directory or user home
  const userHome = process.env.HOME || process.env.USERPROFILE || "";
  const isInWorkingDir = absolutePath.startsWith(workingDir);
  const isInUserHome = userHome && absolutePath.startsWith(userHome);

  if (!isInWorkingDir && !isInUserHome) {
    throw new SecurityError(
      "Path traversal detected - file must be within working directory or user home"
    );
  }

  // Check if file exists AFTER security validation
  if (!fs.existsSync(absolutePath)) {
    err(`File ${filename} not found`);
  }

  // Validate file extension
  const extension = path.extname(absolutePath).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    throw new SecurityError(
      `Invalid file type. Allowed extensions: ${ALLOWED_EXTENSIONS.join(", ")}`
    );
  }

  // Check file size to prevent DoS
  const stats = fs.statSync(absolutePath);
  if (stats.size > MAX_FILE_SIZE) {
    throw new SecurityError(
      `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }

  // Ensure it's a regular file, not a device or socket
  if (!stats.isFile()) {
    throw new SecurityError("Path must be a regular file");
  }

  return absolutePath;
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
