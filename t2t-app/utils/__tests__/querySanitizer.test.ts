import { sanitizePostgRESTQuery, sanitizeUserId, sanitizeId } from '../querySanitizer';

describe('sanitizePostgRESTQuery', () => {
  it('rimuove i caratteri di injection PostgREST', () => {
    // Virgole (usate per AND/OR in PostgREST)
    expect(sanitizePostgRESTQuery('Italy,Spain')).toBe('Italy Spain');

    // Parentesi (grouped filters)
    expect(sanitizePostgRESTQuery('eq.(Italy)')).toBe('eq. Italy');

    // Parentesi graffe (array operators)
    expect(sanitizePostgRESTQuery('{Spain}')).toBe('Spain');

    // Virgolette
    expect(sanitizePostgRESTQuery('"France"')).toBe('France');

    // Backslash
    expect(sanitizePostgRESTQuery('Italy\\Spain')).toBe('Italy Spain');

    // Due punti
    expect(sanitizePostgRESTQuery('Paris:France')).toBe('Paris France');

    // Tentativi combinati
    expect(sanitizePostgRESTQuery(')},destinations.cs.{Spain}')).toBe('destinations.cs. Spain');
  });

  it('blocca punto e virgola (separatore SQL)', () => {
    expect(sanitizePostgRESTQuery('Italy; DROP TABLE diaries')).toBe('Italy DROP TABLE diaries');
  });

  it('blocca segni di uguale (manipolazione filtri)', () => {
    expect(sanitizePostgRESTQuery('name=test;admin=true')).toBe('name test admin true');
  });

  it('blocca parentesi angolari (XSS)', () => {
    expect(sanitizePostgRESTQuery('<script>alert(1)</script>')).toBe('script alert 1 script');
  });

  it('blocca parentesi quadre', () => {
    expect(sanitizePostgRESTQuery('users[0]')).toBe('users 0');
  });

  it('preserva i caratteri sicuri', () => {
    expect(sanitizePostgRESTQuery('hello world')).toBe('hello world');
    expect(sanitizePostgRESTQuery('San-Marino')).toBe('San-Marino');
    expect(sanitizePostgRESTQuery('New_York_City')).toBe('New_York_City');
    expect(sanitizePostgRESTQuery('file.txt')).toBe('file.txt');
  });

  it('gestisce stringhe vuote', () => {
    expect(sanitizePostgRESTQuery('')).toBe('');
    expect(sanitizePostgRESTQuery('   ')).toBe('');
  });

  it('tronca a max 200 caratteri', () => {
    const longInput = 'a'.repeat(300);
    const result = sanitizePostgRESTQuery(longInput);
    expect(result.length).toBe(200);
  });

  it('trimma whitespace dal risultato', () => {
    expect(sanitizePostgRESTQuery('  hello  world  ')).toBe('hello world');
  });
});

describe('sanitizeUserId', () => {
  it('accetta UUID valido', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    expect(sanitizeUserId(uuid)).toBe(uuid);
  });

  it('rifietta UUID non valido', () => {
    expect(sanitizeUserId('not-a-uuid')).toBeNull();
    expect(sanitizeUserId('')).toBeNull();
    expect(sanitizeUserId('550e8400-e29b')).toBeNull();
    expect(sanitizeUserId('DROP TABLE users')).toBeNull();
    expect(sanitizeUserId("'; OR 1=1 --")).toBeNull();
  });

  it('case-insensitive', () => {
    const uuid = '550E8400-E29B-41D4-A716-446655440000';
    expect(sanitizeUserId(uuid)).toBe(uuid);
  });
});

describe('sanitizeId', () => {
  it('accetta UUID risorsa valido', () => {
    expect(sanitizeId('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
  });

  it('rifiutta injection SQL', () => {
    expect(sanitizeId('"; DROP TABLE diaries; --')).toBeNull();
    expect(sanitizeId('1 OR 1=1')).toBeNull();
  });

  it('rifiutta stringhe non-UUID', () => {
    expect(sanitizeId('diary-123')).toBeNull();
    expect(sanitizeId('')).toBeNull();
  });
});
