import { TAG_MAX_LENGTH } from '@notes/shared';

export class InvalidTagError extends Error {
  constructor(readonly input: string) {
    super(`"${input}" is not a valid tag`);
  }
}

const ALLOWED = /^[a-z0-9-]+$/;

/**
 * The single entry point from free text to a tag name.
 *
 * Trim, lowercase, collapse each run of internal whitespace to one hyphen, then
 * assert the result is 1..32 characters of [a-z0-9-]. Two inputs that normalize
 * to the same name are the same tag.
 */
export function normalizeTag(input: string): string {
  const normalized = input.trim().toLowerCase().replace(/\s+/g, '-');

  if (normalized.length < 1 || normalized.length > TAG_MAX_LENGTH || !ALLOWED.test(normalized)) {
    throw new InvalidTagError(input);
  }

  return normalized;
}

/** Normalizes a whole set, preserving order and dropping duplicates. */
export function normalizeTags(inputs: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const input of inputs) {
    const name = normalizeTag(input);
    if (!seen.has(name)) {
      seen.add(name);
      result.push(name);
    }
  }
  return result;
}
