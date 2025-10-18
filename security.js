// ============================================
// SECURITY MODULE
// ============================================
// Handles SQL injection, prompt injection, and data leakage prevention

// ============================================
// 1. SQL INJECTION PROTECTION
// ============================================

/**
 * Validate AI-generated SQL query for security
 * @param {string} sqlQuery - SQL query to validate
 * @returns {Object} { isValid: boolean, error: string }
 */
export function validateSQLQuery(sqlQuery) {
  if (!sqlQuery || typeof sqlQuery !== 'string') {
    return { isValid: false, error: 'Invalid SQL query format' };
  }

  const upperQuery = sqlQuery.toUpperCase().trim();

  // BLACKLIST: Dangerous SQL operations
  const blacklistedOperations = [
    'DROP',
    'DELETE',
    'TRUNCATE',
    'ALTER',
    'CREATE',
    'INSERT',
    'UPDATE',
    'EXEC',
    'EXECUTE',
    'SP_',
    'XP_',
    'BACKUP',
    'RESTORE',
    'SHUTDOWN',
    'GRANT',
    'REVOKE',
    'DENY',
    ';--',           // SQL comment injection
    'UNION',         // Union-based injection
    '0x',            // Hex injection
    'CHAR(',         // Character injection
    'CONCAT(',       // Concatenation attacks
    'WAITFOR',       // Time-based injection
    'BENCHMARK',     // Benchmark attacks
    'SLEEP(',        // Sleep attacks
  ];

  for (const operation of blacklistedOperations) {
    if (upperQuery.includes(operation)) {
      return {
        isValid: false,
        error: `Detected dangerous SQL operation: ${operation}`
      };
    }
  }

  // WHITELIST: Only allow SELECT queries
  if (!upperQuery.startsWith('SELECT')) {
    return {
      isValid: false,
      error: 'Only SELECT queries are allowed'
    };
  }

  // Check for multiple statements (; separator)
  const statements = sqlQuery.split(';').filter(s => s.trim().length > 0);
  if (statements.length > 1) {
    return {
      isValid: false,
      error: 'Multiple SQL statements not allowed'
    };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /--\s*$/,                    // SQL comments at end
    /\/\*.*\*\//,                // Block comments
    /'\s*OR\s*'.*'=/i,          // OR injection
    /'\s*OR\s*1\s*=\s*1/i,      // OR 1=1 injection
    /'\s*AND\s*1\s*=\s*1/i,     // AND 1=1 injection
    /'\s*OR\s*'.*'<>/i,         // OR inequality
    /UNION\s+SELECT/i,           // Union select
    /INTO\s+OUTFILE/i,           // File operations
    /LOAD_FILE/i,                // File loading
    /BENCHMARK\s*\(/i,           // Benchmark
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sqlQuery)) {
      return {
        isValid: false,
        error: `Detected suspicious SQL pattern: ${pattern.toString()}`
      };
    }
  }

  // Validate query length
  if (sqlQuery.length > 5000) {
    return {
      isValid: false,
      error: 'SQL query too long (max 5000 characters)'
    };
  }

  return { isValid: true, error: null };
}

/**
 * Sanitize SQL string values (escape single quotes)
 * @param {string} value - Value to sanitize
 * @returns {string} Sanitized value
 */
export function sanitizeSQLString(value) {
  if (typeof value !== 'string') return value;

  // Escape single quotes
  return value.replace(/'/g, "''");
}

// ============================================
// 2. PROMPT INJECTION PROTECTION
// ============================================

/**
 * Sanitize user input to prevent prompt injection
 * @param {string} userInput - User's question/input
 * @returns {Object} { isValid: boolean, sanitized: string, error: string }
 */
export function sanitizeUserInput(userInput) {
  if (!userInput || typeof userInput !== 'string') {
    return { isValid: false, sanitized: '', error: 'Invalid input format' };
  }

  // Check input length
  if (userInput.length > 2000) {
    return {
      isValid: false,
      sanitized: '',
      error: 'Input too long (max 2000 characters)'
    };
  }

  // Detect prompt injection attempts
  const injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions?/i,
    /forget\s+(all\s+)?(previous|earlier)\s+instructions?/i,
    /system\s*:\s*/i,
    /assistant\s*:\s*/i,
    /\[SYSTEM\]/i,
    /\[INST\]/i,
    /\<\|system\|\>/i,
    /\<\|assistant\|\>/i,
    /you\s+are\s+now/i,
    /your\s+new\s+(role|instructions?|task)/i,
    /disregard\s+(all\s+)?instructions?/i,
    /override\s+instructions?/i,
    /bypass\s+restrictions?/i,
    /reveal\s+(your\s+)?(system\s+)?prompt/i,
    /show\s+me\s+(your\s+)?(system\s+)?prompt/i,
    /print\s+(your\s+)?(system\s+)?prompt/i,
    /display\s+(your\s+)?(system\s+)?prompt/i,
    /what\s+(is|are)\s+your\s+(system\s+)?instructions?/i,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(userInput)) {
      return {
        isValid: false,
        sanitized: '',
        error: 'Detected potential prompt injection attempt'
      };
    }
  }

  // Remove excessive special characters
  const specialCharCount = (userInput.match(/[<>{}[\]\\|]/g) || []).length;
  if (specialCharCount > 10) {
    return {
      isValid: false,
      sanitized: '',
      error: 'Excessive special characters detected'
    };
  }

  // Sanitize: Trim whitespace
  let sanitized = userInput.trim();

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Limit consecutive newlines
  sanitized = sanitized.replace(/\n{4,}/g, '\n\n\n');

  return {
    isValid: true,
    sanitized: sanitized,
    error: null
  };
}

// ============================================
// 3. DATA LEAKAGE PREVENTION
// ============================================

/**
 * Mask sensitive data in response
 * @param {string} text - Response text
 * @returns {string} Masked text
 */
export function maskSensitiveData(text) {
  if (!text || typeof text !== 'string') return text;

  let masked = text;

  // Mask potential passwords (sequences of alphanumeric characters)
  // Pattern: password: xxx or password="xxx" or password='xxx'
  masked = masked.replace(
    /(password|pwd|pass)\s*[:=]\s*['"]?([a-zA-Z0-9@!#$%^&*]{4,})['"]?/gi,
    '$1: ****'
  );

  // Mask potential API keys (long alphanumeric strings)
  masked = masked.replace(
    /([A-Za-z0-9_-]{32,})/g,
    (match) => {
      // Don't mask if it's part of normal words
      if (/^[A-Za-z]+$/.test(match)) return match;
      // Mask API key-like strings
      return match.substring(0, 8) + '...' + match.substring(match.length - 4);
    }
  );

  // Mask potential email addresses (partial)
  masked = masked.replace(
    /([a-zA-Z0-9._-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    (match, user, domain) => {
      if (user.length <= 3) return match;
      return user.substring(0, 3) + '***@' + domain;
    }
  );

  return masked;
}

/**
 * Remove debug information for non-authenticated users
 * @param {string} response - AI response
 * @param {boolean} isAuthenticated - Is user authenticated
 * @returns {string} Cleaned response
 */
export function removeDebugInfo(response, isAuthenticated = false) {
  if (isAuthenticated) return response;

  // Remove debug section if exists
  const debugSectionRegex = /---\n\*\*🔧 DEBUG INFO.*$/s;
  return response.replace(debugSectionRegex, '').trim();
}

/**
 * Check if response contains sensitive table/column names
 * @param {string} response - AI response
 * @returns {boolean} Contains sensitive info
 */
export function containsSensitiveInfo(response) {
  const sensitivePatterns = [
    /\b(password|pwd|passwd)\b/i,
    /\b(secret|token|key)\b/i,
    /\b(ssn|social.?security)\b/i,
    /\b(credit.?card|cvv)\b/i,
    /\b(bank.?account|routing.?number)\b/i,
    /\bSELECT\s+\*\s+FROM\s+/i,  // Prevent full table dumps in response
  ];

  return sensitivePatterns.some(pattern => pattern.test(response));
}

// ============================================
// 4. RATE LIMITING (Simple in-memory)
// ============================================

const rateLimitStore = new Map();

/**
 * Check rate limit for a session
 * @param {string} sessionId - Session identifier
 * @param {number} maxRequests - Max requests per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} { allowed: boolean, remaining: number, resetAt: Date }
 */
export function checkRateLimit(sessionId, maxRequests = 30, windowMs = 60000) {
  const now = Date.now();
  const key = sessionId;

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs
    });
    return { allowed: true, remaining: maxRequests - 1, resetAt: new Date(now + windowMs) };
  }

  const record = rateLimitStore.get(key);

  // Reset if window expired
  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + windowMs;
    return { allowed: true, remaining: maxRequests - 1, resetAt: new Date(record.resetAt) };
  }

  // Check if exceeded
  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(record.resetAt)
    };
  }

  // Increment
  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetAt: new Date(record.resetAt)
  };
}

/**
 * Cleanup expired rate limit entries (call periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt + 60000) { // 1 minute grace period
      rateLimitStore.delete(key);
    }
  }
}

// Auto cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);

// ============================================
// 5. INPUT VALIDATION
// ============================================

/**
 * Validate session ID format
 * @param {string} sessionId - Session identifier
 * @returns {boolean} Is valid
 */
export function validateSessionId(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') return false;

  // Allow alphanumeric, hyphens, underscores
  // Length: 3-100 characters
  return /^[a-zA-Z0-9_-]{3,100}$/.test(sessionId);
}

/**
 * Validate mode parameter
 * @param {string} mode - Operation mode
 * @returns {boolean} Is valid
 */
export function validateMode(mode) {
  return ['internal', 'external'].includes(mode);
}

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export default {
  validateSQLQuery,
  sanitizeSQLString,
  sanitizeUserInput,
  maskSensitiveData,
  removeDebugInfo,
  containsSensitiveInfo,
  checkRateLimit,
  cleanupRateLimitStore,
  validateSessionId,
  validateMode
};
