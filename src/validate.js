export const MAX_NOTE_LENGTH = 280;

export function validateNote(text) {
  if (typeof text !== 'string') {
    return { valid: false, error: 'Please type some text for your note.' };
  }

  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Your note is empty. Write something first!' };
  }

  if (trimmed.length > MAX_NOTE_LENGTH) {
    const over = trimmed.length - MAX_NOTE_LENGTH;
    return {
      valid: false,
      error: `Your note is ${over} character${over === 1 ? '' : 's'} too long. The limit is ${MAX_NOTE_LENGTH}.`,
    };
  }

  return { valid: true, error: null };
}