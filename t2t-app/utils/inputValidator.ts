/**
 * Input validation utilities for user-generated content.
 * All validators return { valid: true, sanitized: string } or { valid: false, reason: string }.
 */

// Maximum lengths
const MAX_COMMENT_LENGTH = 2000;

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

