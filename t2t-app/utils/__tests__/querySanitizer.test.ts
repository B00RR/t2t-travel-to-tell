import { sanitizePostgRESTQuery } from '../querySanitizer';

describe('sanitizePostgRESTQuery', () => {
  it('removes PostgREST injection characters from the query string', () => {
    // Tests for commas and parenthesis (used in OR syntax)
    expect(sanitizePostgRESTQuery('Italy,Spain')).toBe('Italy Spain');
    expect(sanitizePostgRESTQuery('eq.(Italy)')).toBe('eq. Italy');

    // Tests for curly braces and quotes (used in arrays and strings)
    expect(sanitizePostgRESTQuery('{ "Spain" }')).toBe('Spain');
    expect(sanitizePostgRESTQuery('["France", "Germany"]')).toBe('[ France Germany ]');

    // Test for multiple injections combined
    expect(sanitizePostgRESTQuery('Italy,description.ilike.%hack%')).toBe('Italy description.ilike.%hack%');
    expect(sanitizePostgRESTQuery(')},destinations.cs.{Spain}')).toBe('destinations.cs. Spain');
    expect(sanitizePostgRESTQuery('Italy\\Spain:Paris')).toBe('Italy Spain Paris');
  });

  it('preserves normal characters and trims whitespace', () => {
    expect(sanitizePostgRESTQuery('  hello world  ')).toBe('hello world');
    expect(sanitizePostgRESTQuery('San Marino')).toBe('San Marino');
    expect(sanitizePostgRESTQuery('New York City')).toBe('New York City');
    expect(sanitizePostgRESTQuery('Alps & Pyrenees')).toBe('Alps & Pyrenees');
  });

  it('handles empty or undefined strings gracefully', () => {
    expect(sanitizePostgRESTQuery('')).toBe('');
    expect(sanitizePostgRESTQuery('   ')).toBe('');
  });
});
