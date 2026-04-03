import {
  validateComment,
  validateDisplayName,
  validateUsername,
} from '../inputValidator';

describe('validateComment', () => {
  it('accepts valid comment', () => {
    const result = validateComment('Great trip! Loved the food.');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('Great trip! Loved the food.');
  });

  it('rejects empty string', () => {
    expect(validateComment('').valid).toBe(false);
    expect(validateComment('   ').valid).toBe(false);
  });

  it('rejects comment exceeding max length (2000 chars)', () => {
    const longComment = 'a'.repeat(2001);
    const result = validateComment(longComment);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('maximum length');
  });

  it('accepts comment at exactly max length', () => {
    const exactComment = 'a'.repeat(2000);
    const result = validateComment(exactComment);
    expect(result.valid).toBe(true);
  });

  it('rifiuta tag script come contenuto pericoloso', () => {
    const result = validateComment('<b>bold</b><script>alert("xss")</script>');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('unsafe');
  });

  it('strips HTML tags but accepts if text remains', () => {
    const result = validateComment('<b>Hello</b> world');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('Hello world');
  });

  it('rejects javascript: URI scheme', () => {
    const result = validateComment('Check this: javascript:alert(1)');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('unsafe');
  });

  it('rifiuta schema vbscript:', () => {
    const result = validateComment('vbscript:doStuff');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('unsafe');
  });

  it('trims whitespace from valid comment', () => {
    const result = validateComment('   hello   ');
    expect(result.sanitized).toBe('hello');
  });

  it('handles unicode content normally', () => {
    const result = validateComment('Napoli è bellissima 🌊');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('Napoli è bellissima 🌊');
  });
});

describe('validateDisplayName', () => {
  it('accepts valid display name', () => {
    const result = validateDisplayName('Mario Rossi');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('Mario Rossi');
  });

  it('rejects empty name', () => {
    expect(validateDisplayName('').valid).toBe(false);
    expect(validateDisplayName('  ').valid).toBe(false);
  });

  it('rejects name exceeding max length (50 chars)', () => {
    const longName = 'a'.repeat(51);
    expect(validateDisplayName(longName).valid).toBe(false);
  });

  it('accepts name at exactly max length', () => {
    const result = validateDisplayName('a'.repeat(50));
    expect(result.valid).toBe(true);
  });

  it('strips HTML from display name', () => {
    const result = validateDisplayName('<b>Admin</b>');
    expect(result.sanitized).toBe('Admin');
  });

  it('strips javascript: from display name', () => {
    const result = validateDisplayName('javascript:alert(1)');
    expect(result.sanitized).toBe('alert(1)');
  });
});

describe('validateUsername', () => {
  it('accepts valid username', () => {
    const result = validateUsername('mario_rossi');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('mario_rossi');
  });

  it('accepts numeric username', () => {
    expect(validateUsername('user123').valid).toBe(true);
  });

  it('rejects username with spaces', () => {
    expect(validateUsername('mario rossi').valid).toBe(false);
  });

  it('rejects username with special chars', () => {
    expect(validateUsername('mario@rossi').valid).toBe(false);
  });

  it('rejects empty username', () => {
    expect(validateUsername('').valid).toBe(false);
  });

  it('rejects username exceeding max length (30 chars)', () => {
    expect(validateUsername('a'.repeat(31)).valid).toBe(false);
  });

  it('accepts username at exactly max length', () => {
    expect(validateUsername('a'.repeat(30)).valid).toBe(true);
  });

  it('trims whitespace', () => {
    const result = validateUsername('  mario  ');
    expect(result.sanitized).toBe('mario');
  });
});
