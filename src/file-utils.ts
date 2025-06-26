import { validateInputFile } from "./security/input-validator.js";

export function ensureFileExists(filename: string): string {
  return validateInputFile(filename);
}
