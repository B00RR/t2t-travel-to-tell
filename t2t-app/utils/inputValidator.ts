/**
 * Input validation utilities for user-generated content.
 * All validators return { valid: true, sanitized: string } or { valid: false, reason: string }.
 */

// Maximum lengths
const MAX_COMMENT_LENGTH = 2000;
const MAX_BIO_LENGTH = 500;
const MAX_DISPLAY_NAME_LENGTH = 50;
const MAX_USERNAME_LENGTH = 30;

// Regex: strip HTML tags and script-like patterns to prevent XSS in web/webview
const HTML_TAG_REGEX = /<[^>]+>/g;
const SCRIPT_REGEX = /(javascript|data|vbscript)\s*:/gi;

// Detect script-like tags or event handlers BEFORE stripping (used for rejection)
const SCRIPT_TAG_REGEX = /<(script|iframe|object|embed|form|img\s+on\w+)[\s>]/i;
const EVENT_HANDLER_REGEX = /\s*on(load|error|click|mouseover|focus|blur)\s*=/i;
const SCRIPT_URI_REGEX = /(javascript|data|vbscript)\s*:/i;

export interface ValidationResult {
  valid: boolean;
  sanitized: string;
  reason?: string;
}

/**
 * Sanitise and validate comment text.
 */
export function validateComment(content: string): ValidationResult {
  if (!content) return { valid: false, sanitized: '', reason: 'Comment cannot be empty' };

  const trimmed = content.trim();
  if (trimmed.length === 0) return { valid: false, sanitized: '', reason: 'Comment cannot be empty' };
  if (trimmed.length > MAX_COMMENT_LENGTH) return { valid: false, sanitized: '', reason: 'Comment exceeds maximum length (' + MAX_COMMENT_LENGTH + ' chars)' };

  // Check for script tags or event handlers BEFORE stripping (hard reject)
  if (SCRIPT_TAG_REGEX.test(trimmed) || EVENT_HANDLER_REGEX.test(trimmed)) {
    return { valid: false, sanitized: '', reason: 'Comment contains potentially unsafe content' };
  }

  // Check for dangerous URI schemes (no 'g' flag to avoid lastIndex issues)
  if (SCRIPT_URI_REGEX.test(trimmed)) {
    return { valid: false, sanitized: '', reason: 'Comment contains potentially unsafe content' };
  }

  // Strip HTML tags
  const noHtml = trimmed.replace(HTML_TAG_REGEX, '').trim();
  if (noHtml.length === 0) return { valid: false, sanitized: '', reason: 'Comment contains only HTML tags' };

  return { valid: true, sanitized: noHtml };
}

/**
 * Sanitise a display name.
 */
export function validateDisplayName(name: string): ValidationResult {
  const trimmed = name.trim();
  if (trimmed.length === 0) return { valid: false, sanitized: '', reason: 'Name cannot be empty' };
  if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) return { valid: false, sanitized: '', reason: 'Name too long (max ' + MAX_DISPLAY_NAME_LENGTH + ' chars)' };

  // Reject dangerous content (consistent with validateComment/validateBio)
  if (SCRIPT_TAG_REGEX.test(trimmed) || EVENT_HANDLER_REGEX.test(trimmed)) {
    return { valid: false, sanitized: '', reason: 'Name contains potentially unsafe content' };
  }
  if (SCRIPT_URI_REGEX.test(trimmed)) {
    return { valid: false, sanitized: '', reason: 'Name contains potentially unsafe content' };
  }

  // Strip HTML tags
  const sanitized = trimmed.replace(HTML_TAG_REGEX, '').trim();

  return { valid: true, sanitized };
}

/**
 * Validate a username (alphanumeric + underscore, no spaces).
 */
/**
 * Sanitise and validate a user bio.
 */
export function validateBio(bio: string): ValidationResult {
  const trimmed = bio.trim();
  if (trimmed.length === 0) return { valid: false, sanitized: '', reason: 'Bio cannot be empty' };
  if (trimmed.length > MAX_BIO_LENGTH) return { valid: false, sanitized: '', reason: 'Bio exceeds maximum length (' + MAX_BIO_LENGTH + ' chars)' };

  if (SCRIPT_TAG_REGEX.test(trimmed) || EVENT_HANDLER_REGEX.test(trimmed)) {
    return { valid: false, sanitized: '', reason: 'Bio contains potentially unsafe content' };
  }
  if (SCRIPT_URI_REGEX.test(trimmed)) {
    return { valid: false, sanitized: '', reason: 'Bio contains potentially unsafe content' };
  }

  const sanitized = trimmed.replace(HTML_TAG_REGEX, '').trim();
  if (sanitized.length === 0) return { valid: false, sanitized: '', reason: 'Bio contains only HTML tags' };

  return { valid: true, sanitized };
}

/**
 * Validate a username (alphanumeric + underscore, no spaces).
 */
export function validateUsername(username: string): ValidationResult {
  const trimmed = username.trim();
  if (trimmed.length === 0) return { valid: false, sanitized: '', reason: 'Username cannot be empty' };
  if (trimmed.length > MAX_USERNAME_LENGTH) return { valid: false, sanitized: '', reason: 'Username too long (max ' + MAX_USERNAME_LENGTH + ' chars)' };
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return { valid: false, sanitized: '', reason: 'Username can only contain letters, numbers and underscores' };

  return { valid: true, sanitized: trimmed };
}
