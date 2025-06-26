/**
 * Secure logging utility that sanitizes sensitive information
 */
export class SecureLogger {
  private static readonly SENSITIVE_KEYS = [
    "apikey",
    "api_key",
    "api-key",
    "token",
    "access_token",
    "access-token",
    "password",
    "passwd",
    "pwd",
    "secret",
    "private_key",
    "private-key",
    "authorization",
    "auth",
    "bearer",
    "credential",
    "credentials"
  ];

  private static readonly SENSITIVE_PATTERNS = [
    /sk-[a-zA-Z0-9]{48}/, // OpenAI API keys
    /AIza[0-9A-Za-z-_]{35}/, // Google API keys
    /ya29\.[0-9A-Za-z\-_]+/, // Google OAuth tokens
    /ghp_[a-zA-Z0-9]{36}/, // GitHub personal access tokens
    /glpat-[a-zA-Z0-9\-_]{20}/ // GitLab personal access tokens
  ];

  private static readonly REDACTED_TEXT = "[REDACTED]";
  private static enabled = false;

  static enableVerbose(): void {
    this.enabled = true;
  }

  static log(
    level: "info" | "warn" | "error" | "debug",
    message: string,
    ...args: any[]
  ): void {
    if (!this.enabled && level === "debug") {
      return;
    }

    const timestamp = new Date().toISOString();
    const sanitizedArgs = args.map((arg) => this.sanitizeData(arg));
    const sanitizedMessage = this.sanitizeString(message);

    console.log(
      `[${timestamp}] [${level.toUpperCase()}] ${sanitizedMessage}`,
      ...sanitizedArgs
    );
  }

  static info(message: string, ...args: any[]): void {
    this.log("info", message, ...args);
  }

  static warn(message: string, ...args: any[]): void {
    this.log("warn", message, ...args);
  }

  static error(message: string, ...args: any[]): void {
    this.log("error", message, ...args);
  }

  static debug(message: string, ...args: any[]): void {
    this.log("debug", message, ...args);
  }

  /**
   * Sanitizes data by removing or redacting sensitive information
   */
  private static sanitizeData(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === "string") {
      return this.sanitizeString(data);
    }

    if (typeof data === "number" || typeof data === "boolean") {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item));
    }

    if (typeof data === "object") {
      return this.sanitizeObject(data);
    }

    return data;
  }

  /**
   * Sanitizes strings by redacting sensitive patterns
   */
  private static sanitizeString(str: string): string {
    let sanitized = str;

    // Apply pattern-based redaction
    for (const pattern of this.SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, this.REDACTED_TEXT);
    }

    return sanitized;
  }

  /**
   * Sanitizes objects by redacting sensitive keys
   */
  private static sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      if (
        this.SENSITIVE_KEYS.some((sensitiveKey) =>
          lowerKey.includes(sensitiveKey)
        )
      ) {
        sanitized[key] = this.REDACTED_TEXT;
      } else {
        sanitized[key] = this.sanitizeData(value);
      }
    }

    return sanitized;
  }

  /**
   * Creates a sanitized error object for logging
   */
  static sanitizeError(error: Error): object {
    return {
      name: error.name,
      message: this.sanitizeString(error.message),
      stack: error.stack ? this.sanitizeString(error.stack) : undefined
    };
  }
}

/**
 * Legacy verbose logger that uses secure logging
 */
export const verbose = {
  enabled: false,
  log: (...args: any[]) => {
    if (verbose.enabled) {
      SecureLogger.debug("Verbose", ...args);
    }
  }
};
