export function sanitizePostgRESTQuery(input: string): string {
  if (!input) return '';
  // Remove characters that have special meaning in PostgREST .or() syntax
  // such as commas, parentheses, curly braces, quotes, backslashes, and colons
  return input
    .replace(/[,\(\)\{\}"\\:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
