/**
 * Sanitise user input for PostgREST query params.
 * 
 * Uses a whitelist approach: only characters known to be safe for search
 * are allowed (alphanumerics, spaces, basic punctuation).
 * Everything else is replaced with a space.
 * 
 * This is stricter than the previous blacklist approach, closing gaps
 * from unlisted PostgREST special characters.
 */
export function sanitizePostgRESTQuery(input: string): string {
  if (!input || typeof input !== 'string') return '';

  // Whitelist: alphanumeric, space, hyphen, underscore, dot.
  // This covers normal search terms while blocking PostgREST operators
  // like .or(), parentheses, braces, quotes, semicolons, etc.
  const sanitized = input
    .replace(/[^a-zA-Z0-9 _\-.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Limit length to prevent abuse
  return sanitized.slice(0, 200);
}

/**
 * Sanitise a user ID used in queries.
 * Must be a valid-looking UUID to prevent injection into DB queries.
 */
export function sanitizeUserId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(input)) return null;
  return input;
}

/**
 * Sanitise diary / resource IDs for use in queries.
 */
export function sanitizeId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(input)) return null;
  return input;
}
