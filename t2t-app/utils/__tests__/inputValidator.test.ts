import {
  validateComment,
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

  it('rejects script tag as dangerous content', () => {
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

  it('rejects vbscript: URI scheme', () => {
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

