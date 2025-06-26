import { createHash } from "crypto";
import { createWriteStream, unlinkSync } from "fs";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { SecurityError } from "./input-validator.js";
import { SecureLogger } from "./secure-logger.js";

const DOWNLOAD_TIMEOUT = 300000; // 5 minutes
const MAX_DOWNLOAD_SIZE = 10 * 1024 * 1024 * 1024; // 10GB
const ALLOWED_CONTENT_TYPES = [
  'application/octet-stream',
  'application/x-binary',
  'binary/octet-stream'
];

export interface SecureDownloadOptions {
  expectedHash?: string;
  expectedSize?: number;
  maxSize?: number;
  timeout?: number;
  allowedContentTypes?: string[];
}

/**
 * Secure file download with integrity verification
 */
export class SecureDownloader {
  /**
   * Downloads a file with security checks and integrity verification
   */
  static async secureDownload(
    url: URL,
    outputPath: string,
    options: SecureDownloadOptions = {}
  ): Promise<void> {
    const maxSize = options.maxSize || MAX_DOWNLOAD_SIZE;
    const timeout = options.timeout || DOWNLOAD_TIMEOUT;
    const allowedTypes = options.allowedContentTypes || ALLOWED_CONTENT_TYPES;

    SecureLogger.info('Starting secure download', { 
      url: url.hostname + url.pathname, // Don't log full URL with potential secrets
      outputPath,
      expectedHash: options.expectedHash ? '[PROVIDED]' : 'none'
    });

    // Validate URL
    this.validateDownloadUrl(url);

    let response: Response;
    try {
      // Fetch with timeout and security headers
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'HumanifyJS/2.1.2 (Security-Enhanced)',
          'Accept': allowedTypes.join(', '),
          'Cache-Control': 'no-cache'
        },
        redirect: 'error' // Prevent redirect attacks
      });

      clearTimeout(timeoutId);
    } catch (error) {
      throw new SecurityError(`Download failed: ${(error as Error).message}`);
    }

    // Validate response
    this.validateDownloadResponse(response, allowedTypes, maxSize);

    // Create temporary file for atomic download
    const tmpPath = `${outputPath}.tmp`;
    
    try {
      await this.downloadToFile(response, tmpPath, maxSize);
      
      // Verify integrity if hash provided
      if (options.expectedHash) {
        await this.verifyFileIntegrity(tmpPath, options.expectedHash);
      }

      // Verify size if provided
      if (options.expectedSize) {
        await this.verifyFileSize(tmpPath, options.expectedSize);
      }

      // Atomic move to final location
      const fs = await import('fs/promises');
      await fs.rename(tmpPath, outputPath);

      SecureLogger.info('Download completed successfully', { outputPath });

    } catch (error) {
      // Clean up on failure
      try {
        unlinkSync(tmpPath);
      } catch (cleanupError) {
        SecureLogger.warn('Failed to clean up temporary file', { tmpPath });
      }
      throw error;
    }
  }

  /**
   * Validates the download URL for security
   */
  private static validateDownloadUrl(url: URL): void {
    // Only allow HTTPS
    if (url.protocol !== 'https:') {
      throw new SecurityError('Only HTTPS downloads are allowed');
    }

    // Validate hostname - prevent localhost and private IPs
    const hostname = url.hostname.toLowerCase();
    
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      throw new SecurityError('Downloads from localhost are not allowed');
    }

    // Block private IP ranges
    if (this.isPrivateIP(hostname)) {
      throw new SecurityError('Downloads from private IP addresses are not allowed');
    }

    // Validate against allowed domains
    const allowedDomains = [
      'huggingface.co',
      'github.com',
      'githubusercontent.com'
    ];

    if (!allowedDomains.some(domain => hostname.endsWith(domain))) {
      throw new SecurityError(`Downloads only allowed from: ${allowedDomains.join(', ')}`);
    }
  }

  /**
   * Checks if an IP address is in a private range
   */
  private static isPrivateIP(hostname: string): boolean {
    const privateRanges = [
      /^10\./, // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
      /^192\.168\./, // 192.168.0.0/16
      /^fc00:/, // fc00::/7 (IPv6)
      /^fe80:/ // fe80::/10 (IPv6)
    ];

    return privateRanges.some(range => range.test(hostname));
  }

  /**
   * Validates the download response
   */
  private static validateDownloadResponse(
    response: Response,
    allowedTypes: string[],
    maxSize: number
  ): void {
    if (!response.ok) {
      throw new SecurityError(`Download failed with status: ${response.status}`);
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (contentType && !allowedTypes.some(type => contentType.includes(type))) {
      throw new SecurityError(`Invalid content type: ${contentType}`);
    }

    // Check content length
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > maxSize) {
      throw new SecurityError(`File too large: ${contentLength} bytes (max: ${maxSize})`);
    }
  }

  /**
   * Downloads response body to file with size monitoring
   */
  private static async downloadToFile(
    response: Response,
    outputPath: string,
    maxSize: number
  ): Promise<void> {
    if (!response.body) {
      throw new SecurityError('Response body is empty');
    }

    const fileStream = createWriteStream(outputPath);
    const readStream = Readable.fromWeb(response.body);
    
    let downloadedBytes = 0;

    // Monitor download progress and size
    readStream.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      if (downloadedBytes > maxSize) {
        readStream.destroy();
        fileStream.destroy();
        throw new SecurityError(`Download exceeded size limit: ${maxSize} bytes`);
      }
    });

    try {
      await finished(readStream.pipe(fileStream));
    } catch (error) {
      throw new SecurityError(`Download stream error: ${(error as Error).message}`);
    }
  }

  /**
   * Verifies file integrity using SHA-256 hash
   */
  private static async verifyFileIntegrity(filePath: string, expectedHash: string): Promise<void> {
    const fs = await import('fs/promises');
    
    try {
      const fileBuffer = await fs.readFile(filePath);
      const actualHash = createHash('sha256').update(fileBuffer).digest('hex');
      
      if (actualHash !== expectedHash.toLowerCase()) {
        throw new SecurityError(`File integrity check failed. Expected: ${expectedHash}, Got: ${actualHash}`);
      }

      SecureLogger.info('File integrity verified', { expectedHash, actualHash });
    } catch (error) {
      if (error instanceof SecurityError) {
        throw error;
      }
      throw new SecurityError(`Integrity verification failed: ${(error as Error).message}`);
    }
  }

  /**
   * Verifies file size matches expected size
   */
  private static async verifyFileSize(filePath: string, expectedSize: number): Promise<void> {
    const fs = await import('fs/promises');
    
    try {
      const stats = await fs.stat(filePath);
      if (stats.size !== expectedSize) {
        throw new SecurityError(`File size mismatch. Expected: ${expectedSize}, Got: ${stats.size}`);
      }

      SecureLogger.info('File size verified', { expectedSize, actualSize: stats.size });
    } catch (error) {
      if (error instanceof SecurityError) {
        throw error;
      }
      throw new SecurityError(`Size verification failed: ${(error as Error).message}`);
    }
  }
} 