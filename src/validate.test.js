import { validateNote, MAX_NOTE_LENGTH } from './validate.js';

describe('validateNote', () => {
  test('rejects an empty string', () => {
    const result = validateNote('');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/empty/i);
  });

  test('rejects whitespace-only input', () => {
    expect(validateNote('     ').valid).toBe(false);
  });

  test('rejects non-string input', () => {
    expect(validateNote(null).valid).toBe(false);
    expect(validateNote(undefined).valid).toBe(false);
    expect(validateNote(123).valid).toBe(false);
  });

  test('accepts a 1-character note', () => {
    expect(validateNote('a')).toEqual({ valid: true, error: null });
  });

  test('accepts exactly 280 characters', () => {
    expect(validateNote('a'.repeat(MAX_NOTE_LENGTH)).valid).toBe(true);
  });

  test('rejects 281 characters with a singular message', () => {
    const result = validateNote('a'.repeat(MAX_NOTE_LENGTH + 1));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/1 character too long/);
  });

  test('rejects far-too-long input with a plural message', () => {
    const result = validateNote('a'.repeat(500));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/220 characters too long/);
  });

  test('ignores surrounding whitespace when counting', () => {
    expect(validateNote('  ' + 'a'.repeat(280) + '  ').valid).toBe(true);
  });

  test('accepts emoji and special characters', () => {
    expect(validateNote('Hello 😀 <b>&"\'').valid).toBe(true);
  });
});