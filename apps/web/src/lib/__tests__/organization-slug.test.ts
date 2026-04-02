import { describe, it, expect } from 'vitest';
import {
  generateOrganizationSlug,
  isValidOrganizationSlug,
  generateUniqueOrganizationSlug,
} from '../organization-slug';

// ─── generateOrganizationSlug ─────────────────────────────────────────────────

describe('generateOrganizationSlug', () => {
  it('converts to lowercase', () => {
    expect(generateOrganizationSlug('MyCompany')).toBe('mycompany');
  });

  it('replaces spaces with hyphens', () => {
    expect(generateOrganizationSlug('My Company')).toBe('my-company');
  });

  it('handles multiple spaces', () => {
    expect(generateOrganizationSlug('My  Big  Company')).toBe('my-big-company');
  });

  it('removes special characters', () => {
    expect(generateOrganizationSlug('Acme & Co.')).toBe('acme-co');
  });

  it('trims leading and trailing spaces', () => {
    expect(generateOrganizationSlug('  My Company  ')).toBe('my-company');
  });

  it('removes leading and trailing hyphens after processing', () => {
    const result = generateOrganizationSlug('---Company---');
    expect(result).not.toMatch(/^-/);
    expect(result).not.toMatch(/-$/);
  });

  it('collapses multiple consecutive hyphens', () => {
    const result = generateOrganizationSlug('Company -- Name');
    expect(result).not.toContain('--');
  });

  it('limits length to 50 characters', () => {
    const longName = 'A'.repeat(60);
    const result = generateOrganizationSlug(longName);
    expect(result.length).toBeLessThanOrEqual(50);
  });

  it('truncated slug does not end with hyphen', () => {
    const longName = 'word '.repeat(15); // ~75 chars after processing
    const result = generateOrganizationSlug(longName);
    expect(result).not.toMatch(/-$/);
  });

  it('returns "org" for names that produce empty slug', () => {
    const result = generateOrganizationSlug('!@#$%^');
    expect(result).toBe('org');
  });

  it('throws for empty string', () => {
    expect(() => generateOrganizationSlug('')).toThrow();
  });

  it('throws for non-string input', () => {
    expect(() => generateOrganizationSlug(null as any)).toThrow();
    expect(() => generateOrganizationSlug(undefined as any)).toThrow();
  });

  it('handles alphanumeric names correctly', () => {
    expect(generateOrganizationSlug('Company123')).toBe('company123');
  });

  it('handles names with only numbers', () => {
    expect(generateOrganizationSlug('12345')).toBe('12345');
  });
});

// ─── isValidOrganizationSlug ──────────────────────────────────────────────────

describe('isValidOrganizationSlug', () => {
  it('returns true for simple valid slug', () => {
    expect(isValidOrganizationSlug('my-company')).toBe(true);
  });

  it('returns true for slug with only letters', () => {
    expect(isValidOrganizationSlug('company')).toBe(true);
  });

  it('returns true for slug with numbers', () => {
    expect(isValidOrganizationSlug('company123')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(isValidOrganizationSlug('')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isValidOrganizationSlug(null as any)).toBe(false);
  });

  it('returns false for slug longer than 50 chars', () => {
    expect(isValidOrganizationSlug('a'.repeat(51))).toBe(false);
  });

  it('returns true for slug with exactly 50 chars', () => {
    expect(isValidOrganizationSlug('a'.repeat(50))).toBe(true);
  });

  it('returns false for slug starting with hyphen', () => {
    expect(isValidOrganizationSlug('-company')).toBe(false);
  });

  it('returns false for slug ending with hyphen', () => {
    expect(isValidOrganizationSlug('company-')).toBe(false);
  });

  it('returns false for slug with double hyphens', () => {
    expect(isValidOrganizationSlug('my--company')).toBe(false);
  });

  it('returns false for slug with uppercase letters', () => {
    expect(isValidOrganizationSlug('MyCompany')).toBe(false);
  });

  it('returns false for slug with spaces', () => {
    expect(isValidOrganizationSlug('my company')).toBe(false);
  });

  it('returns false for slug with special characters', () => {
    expect(isValidOrganizationSlug('my_company')).toBe(false);
    expect(isValidOrganizationSlug('my.company')).toBe(false);
  });
});

// ─── generateUniqueOrganizationSlug ──────────────────────────────────────────

describe('generateUniqueOrganizationSlug', () => {
  it('returns baseSlug when not in existing list', () => {
    const result = generateUniqueOrganizationSlug('acme', []);
    expect(result).toBe('acme');
  });

  it('returns baseSlug when not conflicting', () => {
    const result = generateUniqueOrganizationSlug('acme', ['other-org', 'another']);
    expect(result).toBe('acme');
  });

  it('returns baseSlug-1 when baseSlug already exists', () => {
    const result = generateUniqueOrganizationSlug('acme', ['acme']);
    expect(result).toBe('acme-1');
  });

  it('increments counter until unique slug found', () => {
    const result = generateUniqueOrganizationSlug('acme', ['acme', 'acme-1', 'acme-2']);
    expect(result).toBe('acme-3');
  });

  it('uses timestamp fallback when max attempts exceeded', () => {
    // Build list with all attempts taken
    const existing = ['base'];
    for (let i = 1; i <= 100; i++) {
      existing.push(`base-${i}`);
    }
    const result = generateUniqueOrganizationSlug('base', existing, 100);
    // Should contain a timestamp-like number
    expect(result).toMatch(/^base-\d+$/);
    expect(result).not.toBe('base-101');
  });

  it('respects custom maxAttempts', () => {
    const existing = ['slug', 'slug-1', 'slug-2'];
    const result = generateUniqueOrganizationSlug('slug', existing, 5);
    expect(result).toBe('slug-3');
  });
});
