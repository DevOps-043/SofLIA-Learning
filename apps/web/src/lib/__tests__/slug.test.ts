import { describe, it, expect, vi } from 'vitest';
import {
  sanitizeSlug,
  isValidSlug,
  generateUniqueSlug,
  generateUniqueSlugAsync,
  extractSlugFromUrl,
} from '../slug';

// ─── sanitizeSlug ─────────────────────────────────────────────────────────────

describe('sanitizeSlug', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizeSlug('')).toBe('');
  });

  it('returns empty string for null-ish input', () => {
    expect(sanitizeSlug(null as any)).toBe('');
    expect(sanitizeSlug(undefined as any)).toBe('');
  });

  it('converts to lowercase', () => {
    expect(sanitizeSlug('HELLO')).toBe('hello');
    expect(sanitizeSlug('HelloWorld')).toBe('helloworld');
  });

  it('converts spaces to hyphens', () => {
    expect(sanitizeSlug('hello world')).toBe('hello-world');
    expect(sanitizeSlug('my course title')).toBe('my-course-title');
  });

  it('removes accents and diacritics', () => {
    expect(sanitizeSlug('Programación')).toBe('programacion');
    expect(sanitizeSlug('México')).toBe('mexico');
    expect(sanitizeSlug('año')).toBe('ano');
    expect(sanitizeSlug('café')).toBe('cafe');
  });

  it('handles ñ → n', () => {
    expect(sanitizeSlug('ñoño')).toBe('nono');
  });

  it('removes special characters', () => {
    expect(sanitizeSlug('Programación en C++')).toBe('programacion-en-c');
    expect(sanitizeSlug('Hello & World!')).toBe('hello-world');
  });

  it('prevents path traversal', () => {
    const result = sanitizeSlug('../../../etc/passwd');
    expect(result).not.toContain('..');
    expect(result).not.toContain('/');
    // Should produce something like "etc-passwd"
    expect(result).toContain('etc');
    expect(result).toContain('passwd');
  });

  it('strips XSS attempts', () => {
    const result = sanitizeSlug('<script>alert(1)</script>');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  it('collapses multiple hyphens to single', () => {
    expect(sanitizeSlug('hello---world')).toBe('hello-world');
  });

  it('trims leading and trailing hyphens', () => {
    const result = sanitizeSlug('---hello---');
    expect(result).not.toMatch(/^-/);
    expect(result).not.toMatch(/-$/);
  });

  it('limits to 100 characters', () => {
    const longInput = 'a'.repeat(200);
    expect(sanitizeSlug(longInput).length).toBeLessThanOrEqual(100);
  });

  it('handles common Spanish community name', () => {
    const result = sanitizeSlug('Comunidad de Aprendizaje');
    expect(result).toBe('comunidad-de-aprendizaje');
  });

  it('removes emojis', () => {
    const result = sanitizeSlug('Comunidad 😀');
    expect(result).not.toMatch(/[^\x00-\x7F]/);
  });

  it('handles single word', () => {
    expect(sanitizeSlug('javascript')).toBe('javascript');
  });

  it('handles numbers', () => {
    expect(sanitizeSlug('curso101')).toBe('curso101');
    expect(sanitizeSlug('Curso 101')).toBe('curso-101');
  });
});

// ─── isValidSlug ──────────────────────────────────────────────────────────────

describe('isValidSlug', () => {
  it('returns false for empty string', () => {
    expect(isValidSlug('')).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isValidSlug(null as any)).toBe(false);
    expect(isValidSlug(undefined as any)).toBe(false);
  });

  it('returns true for valid simple slug', () => {
    expect(isValidSlug('comunidad-aprendizaje')).toBe(true);
  });

  it('returns true for slug with numbers', () => {
    expect(isValidSlug('curso-101')).toBe(true);
    expect(isValidSlug('javascript-2025')).toBe(true);
  });

  it('returns false for slug with spaces', () => {
    expect(isValidSlug('hello world')).toBe(false);
  });

  it('returns false for slug with uppercase', () => {
    expect(isValidSlug('Hello-World')).toBe(false);
  });

  it('returns false for slug starting with hyphen', () => {
    expect(isValidSlug('-comunidad')).toBe(false);
  });

  it('returns false for slug ending with hyphen', () => {
    expect(isValidSlug('comunidad-')).toBe(false);
  });

  it('returns false for consecutive hyphens', () => {
    expect(isValidSlug('hello--world')).toBe(false);
  });

  it('returns false for slug shorter than 3 chars', () => {
    expect(isValidSlug('ab')).toBe(false);
    expect(isValidSlug('a')).toBe(false);
  });

  it('returns true for exactly 3 chars', () => {
    expect(isValidSlug('abc')).toBe(true);
  });

  it('returns false for slug longer than 100 chars', () => {
    const longSlug = 'a'.repeat(101);
    expect(isValidSlug(longSlug)).toBe(false);
  });

  it('returns true for exactly 100 chars', () => {
    const maxSlug = 'a'.repeat(100);
    expect(isValidSlug(maxSlug)).toBe(true);
  });

  it('returns false for path traversal', () => {
    expect(isValidSlug('../etc/passwd')).toBe(false);
  });

  it('returns false for XSS attempt', () => {
    expect(isValidSlug('<script>')).toBe(false);
  });
});

// ─── generateUniqueSlug ───────────────────────────────────────────────────────

describe('generateUniqueSlug', () => {
  it('returns sanitized slug when no conflicts', () => {
    const result = generateUniqueSlug('Mi Comunidad', []);
    expect(result).toBe('mi-comunidad');
  });

  it('appends -1 when base slug already exists', () => {
    const result = generateUniqueSlug('comunidad', ['comunidad']);
    expect(result).toBe('comunidad-1');
  });

  it('increments counter until unique', () => {
    const existing = ['comunidad', 'comunidad-1', 'comunidad-2'];
    const result = generateUniqueSlug('comunidad', existing);
    expect(result).toBe('comunidad-3');
  });

  it('returns slug with default [] when no existingSlugs provided', () => {
    const result = generateUniqueSlug('Programación');
    expect(result).toBe('programacion');
  });

  it('generates fallback for empty name after sanitization', () => {
    const result = generateUniqueSlug('😀😀😀');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('does not return a slug already in existingSlugs', () => {
    const existing = ['test', 'test-1', 'test-2', 'test-3'];
    const result = generateUniqueSlug('test', existing);
    expect(existing).not.toContain(result);
  });
});

// ─── generateUniqueSlugAsync ──────────────────────────────────────────────────

describe('generateUniqueSlugAsync', () => {
  it('returns slug when it does not exist', async () => {
    const checkExists = vi.fn().mockResolvedValue(false);
    const result = await generateUniqueSlugAsync('Mi Comunidad', checkExists);
    expect(result).toBe('mi-comunidad');
    expect(checkExists).toHaveBeenCalledWith('mi-comunidad');
  });

  it('appends counter when slug exists', async () => {
    const checkExists = vi.fn()
      .mockResolvedValueOnce(true)   // 'slug' exists
      .mockResolvedValueOnce(false); // 'slug-1' available
    const result = await generateUniqueSlugAsync('slug', checkExists);
    expect(result).toBe('slug-1');
  });

  it('increments until free slug found', async () => {
    const checkExists = vi.fn()
      .mockResolvedValueOnce(true)  // 'test' exists
      .mockResolvedValueOnce(true)  // 'test-1' exists
      .mockResolvedValueOnce(true)  // 'test-2' exists
      .mockResolvedValueOnce(false); // 'test-3' free
    const result = await generateUniqueSlugAsync('test', checkExists);
    expect(result).toBe('test-3');
  });

  it('generates fallback for empty sanitized name', async () => {
    const checkExists = vi.fn().mockResolvedValue(false);
    const result = await generateUniqueSlugAsync('😀', checkExists);
    expect(result).toBeTruthy();
  });
});

// ─── extractSlugFromUrl ───────────────────────────────────────────────────────

describe('extractSlugFromUrl', () => {
  it('returns empty string for empty input', () => {
    expect(extractSlugFromUrl('')).toBe('');
  });

  it('extracts last segment from path', () => {
    expect(extractSlugFromUrl('/communities/mi-comunidad')).toBe('mi-comunidad');
  });

  it('extracts from full URL', () => {
    const result = extractSlugFromUrl('https://example.com/curso/javascript-101');
    expect(result).toBe('javascript-101');
  });

  it('sanitizes the extracted segment', () => {
    const result = extractSlugFromUrl('/communities/My Community');
    expect(result).toBe('my-community');
  });

  it('handles trailing slash', () => {
    const result = extractSlugFromUrl('/communities/slug/');
    // segments filter(Boolean) removes empty last segment
    expect(result).toBe('slug');
  });

  it('handles URL without path', () => {
    const result = extractSlugFromUrl('https://example.com');
    expect(typeof result).toBe('string');
  });
});
