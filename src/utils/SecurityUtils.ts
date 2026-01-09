/**
 * Security utilities for sanitizing sensitive data in logs
 * Prevents CWE-312, CWE-359, and CWE-532 vulnerabilities
 */

/**
 * Global log verbosity level
 * 'secure' = sanitized logs (default, recommended)
 * 'verbose' = full logs with sensitive data (development only)
 */
let globalLogLevel: 'secure' | 'verbose' = 'secure';

export function setLogLevel(level: 'secure' | 'verbose'): void {
  globalLogLevel = level;
}

export function getLogLevel(): 'secure' | 'verbose' {
  return globalLogLevel;
}

export function shouldSanitize(): boolean {
  return globalLogLevel === 'secure';
}

/**
 * Mask sensitive strings (passwords, tokens, keys)
 * Shows only first 4 and last 4 characters
 */
export function maskSensitive(value: string | null | undefined, visibleChars = 4): string {
  if (!value || value.length === 0) {
    return '[REDACTED]';
  }

  if (value.length <= visibleChars * 2) {
    return '*'.repeat(value.length);
  }

  const start = value.substring(0, visibleChars);
  const end = value.substring(value.length - visibleChars);
  const masked = '*'.repeat(Math.max(0, value.length - visibleChars * 2));

  return `${start}${masked}${end}`;
}

/**
 * Truncate and mask session IDs
 * Shows only first 8 characters in secure mode, full value in verbose mode
 */
export function sanitizeSessionId(sessionId: string | null | undefined): string {
  if (!sessionId) {
    return '[REDACTED]';
  }

  if (!shouldSanitize()) {
    return sessionId; // Return full value in verbose mode
  }

  if (sessionId.length <= 8) {
    return '*'.repeat(sessionId.length);
  }

  return `${sessionId.substring(0, 8)}...${'*'.repeat(16)}`;
}

/**
 * Sanitize object by removing sensitive keys
 * Returns full object in verbose mode, sanitized in secure mode
 */
export function sanitizeObject(obj: any, sensitiveKeys: string[] = []): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (!shouldSanitize()) {
    return obj; // Return full object in verbose mode
  }

  const defaultSensitiveKeys = [
    'password',
    'token',
    'secret',
    'key',
    'appKey',
    'app_key',
    'apiKey',
    'api_key',
    'sessionId',
    'session_id',
    'csrfToken',
    'csrf_token',
    '_token',
    'mac',
    'iv',
    'value',
    'decrypted',
    'payload',
  ];

  const allSensitiveKeys = [...defaultSensitiveKeys, ...sensitiveKeys];
  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    if (allSensitiveKeys.some(sk => lowerKey.includes(sk.toLowerCase()))) {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = '[REDACTED OBJECT]';
      } else {
        sanitized[key] = '[REDACTED]';
      }
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key], sensitiveKeys);
    }
  }

  return sanitized;
}

/**
 * Sanitize array of sensitive values
 */
export function sanitizeArray(arr: any[], maxItems = 3): any {
  if (!Array.isArray(arr)) {
    return arr;
  }

  const sanitized = arr.slice(0, maxItems).map(item => {
    if (typeof item === 'string') {
      return maskSensitive(item);
    }
    return sanitizeObject(item);
  });

  if (arr.length > maxItems) {
    sanitized.push(`... and ${arr.length - maxItems} more items`);
  }

  return sanitized;
}

/**
 * Sanitize error messages to remove sensitive data
 * Returns full error in verbose mode, sanitized in secure mode
 */
export function sanitizeError(error: any): string {
  if (!error) {
    return 'Unknown error';
  }

  if (!shouldSanitize()) {
    // Return full error in verbose mode
    if (typeof error === 'string') {
      return error;
    }
    if (error.message) {
      return error.message;
    }
    return String(error);
  }

  if (typeof error === 'string') {
    // Remove potential sensitive data patterns
    return error
      .replace(/password[=:]\s*[^\s,}]+/gi, 'password=[REDACTED]')
      .replace(/token[=:]\s*[^\s,}]+/gi, 'token=[REDACTED]')
      .replace(/key[=:]\s*[^\s,}]+/gi, 'key=[REDACTED]')
      .replace(/session[=:]\s*[^\s,}]+/gi, 'session=[REDACTED]');
  }

  if (error.message) {
    return sanitizeError(error.message);
  }

  return '[REDACTED ERROR]';
}

