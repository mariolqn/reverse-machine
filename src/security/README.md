# Security Modules

This directory contains security-hardened modules that address critical vulnerabilities identified in the security audit.

## 🛡️ Security Fixes Implemented

### Critical Vulnerabilities Addressed

| Vulnerability       | CVSS Score | Status   | Module                 |
| ------------------- | ---------- | -------- | ---------------------- |
| Path Traversal      | 9.1        | ✅ Fixed | `input-validator.ts`   |
| Unsafe JSON Parsing | 8.5        | ✅ Fixed | `secure-json.ts`       |
| Code Injection      | 8.2        | ✅ Fixed | `secure-processing.ts` |
| API Key Exposure    | 8.0        | ✅ Fixed | `secure-logger.ts`     |
| Directory Traversal | 6.8        | ✅ Fixed | `input-validator.ts`   |
| Unsafe Downloads    | 6.5        | ✅ Fixed | `secure-downloads.ts`  |

## 📋 Module Overview

### `input-validator.ts`

- **Purpose**: Validates and sanitizes file paths and output directories
- **Features**:
  - Path traversal prevention
  - File size limits (100MB max)
  - Extension whitelist (`.js`, `.mjs`, `.min.js`, `.ts`)
  - Working directory restrictions
  - Filename sanitization

### `secure-json.ts`

- **Purpose**: Safe JSON parsing with schema validation
- **Features**:
  - Prototype pollution protection
  - Schema validation with AJV
  - Size limits (10MB max)
  - Dangerous pattern detection
  - Strict type checking

### `secure-logger.ts`

- **Purpose**: Sanitized logging that prevents data leaks
- **Features**:
  - API key redaction (OpenAI, Google, GitHub patterns)
  - Sensitive data sanitization
  - Structured logging with timestamps
  - Pattern-based redaction
  - Error sanitization

### `secure-processing.ts`

- **Purpose**: Sandboxed code execution with resource limits
- **Features**:
  - Worker thread isolation
  - Memory limits (200MB max)
  - Timeout protection (30s)
  - Dangerous pattern detection
  - Resource cleanup

### `secure-downloads.ts`

- **Purpose**: Secure file downloads with integrity verification
- **Features**:
  - HTTPS-only downloads
  - Domain whitelist
  - SHA-256 integrity checks
  - Size limits (10GB max)
  - Private IP blocking
  - Atomic downloads

## 🔧 Usage Examples

### Secure File Validation

```typescript
import { validateInputFile, validateOutputPath } from "./input-validator.js";

// Validates and returns safe absolute path
const safePath = validateInputFile("user-input.js");

// Creates and validates output directory
const safeOutputDir = validateOutputPath("output");
```

### Secure JSON Parsing

```typescript
import { parseSecureJSON, OpenAIRenameSchema } from "./secure-json.js";

// Parse with schema validation and security checks
const data = parseSecureJSON(jsonString, OpenAIRenameSchema, "API response");
```

### Secure Logging

```typescript
import { SecureLogger } from "./secure-logger.js";

// Automatically redacts sensitive information
SecureLogger.info("Processing request", {
  apiKey: "sk-sensitive", // Will be redacted
  user: "john@example.com"
});
```

### Secure Downloads

```typescript
import { SecureDownloader } from "./secure-downloads.js";

await SecureDownloader.secureDownload(url, outputPath, {
  expectedHash: "sha256-hash-here",
  expectedSize: 1024000,
  timeout: 60000
});
```

## 🧪 Testing

Security tests are included in `security-tests.test.ts`:

```bash
# Run security tests
npm run test:unit -- src/security/security-tests.test.ts
```

## 🚨 Security Configuration

### File Limits

- **Max file size**: 100MB for input files
- **Max JSON size**: 10MB for API responses
- **Max code size**: 50MB for Babel processing
- **Max download size**: 10GB for model downloads

### Path Restrictions

- **Input files**: Must be within working directory or user home
- **Output directories**: Must be within working directory
- **Dangerous paths**: `/etc`, `/usr`, `/var`, `/bin`, `/sbin` blocked

### Content Validation

- **File extensions**: `.js`, `.mjs`, `.min.js`, `.ts` only
- **Download domains**: `huggingface.co`, `github.com`, `githubusercontent.com`
- **JSON schemas**: Strict validation with AJV
- **Code patterns**: Blocks `eval`, `require('fs')`, `process.*`, etc.

## 🔐 Security Best Practices

### For Developers

1. **Always use security modules** instead of native Node.js functions
2. **Validate all inputs** before processing
3. **Use structured logging** to prevent data leaks
4. **Test security boundaries** with the provided test suite
5. **Review code patterns** for new vulnerabilities

### For Operations

1. **Monitor logs** for SecurityError exceptions
2. **Set resource limits** appropriate for your environment
3. **Regular security audits** of dependencies
4. **Update security modules** when vulnerabilities are discovered
5. **Backup and verify** model checksums

## 📞 Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** create a public issue
2. **Email security concerns** to the maintainers
3. **Include detailed reproduction** steps
4. **Wait for confirmation** before public disclosure

## 🔄 Migration Guide

### From Legacy Code

**Before (Vulnerable)**:

```typescript
const fs = require("fs");
const data = fs.readFileSync(userInput); // Path traversal risk
const parsed = JSON.parse(apiResponse); // Prototype pollution risk
console.log("API Key:", apiKey); // Data leak risk
```

**After (Secure)**:

```typescript
import { validateInputFile } from "./security/input-validator.js";
import { parseSecureJSON, Schema } from "./security/secure-json.js";
import { SecureLogger } from "./security/secure-logger.js";

const safePath = validateInputFile(userInput);
const data = fs.readFileSync(safePath);
const parsed = parseSecureJSON(apiResponse, Schema);
SecureLogger.info("Processing", { apiKey }); // Automatically redacted
```

---

**⚠️ Security Notice**: These modules implement defense-in-depth security controls. While they significantly improve security posture, they should be part of a comprehensive security strategy including regular audits, dependency scanning, and security testing.
