import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildOtpAuthUri,
  createProvisioning,
  decodeBase32,
  encodeBase32,
  generateRecoveryCodes,
  generateSecret,
  generateTotp,
  verifyTotp,
} from '../totp';

describe('TOTP (RFC 6238)', () => {
  describe('base32 round-trip', () => {
    it('encodes and decodes binary correctly', () => {
      const buffer = Buffer.from([12, 34, 56, 78, 90, 123]);
      const encoded = encodeBase32(buffer);
      expect(decodeBase32(encoded).toString('hex')).toBe(buffer.toString('hex'));
    });

    it('rejects invalid base32', () => {
      expect(() => decodeBase32('!!!!')).toThrow('INVALID_BASE32_CHARACTER');
    });
  });

  describe('secret generation', () => {
    it('returns base32 string of expected length', () => {
      const secret = generateSecret();
      expect(secret).toMatch(/^[A-Z2-7]+$/u);
      expect(secret.length).toBeGreaterThanOrEqual(32);
    });

    it('returns different secrets each call', () => {
      const a = generateSecret();
      const b = generateSecret();
      expect(a).not.toBe(b);
    });
  });

  describe('TOTP generation and verification', () => {
    const SECRET = generateSecret();

    it('produces 6-digit code by default', () => {
      const code = generateTotp(SECRET);
      expect(code).toMatch(/^\d{6}$/u);
    });

    it('verifies a freshly generated code', () => {
      const code = generateTotp(SECRET);
      expect(verifyTotp(SECRET, code)).toBe(true);
    });

    it('rejects a code generated for an unrelated secret', () => {
      const other = generateSecret();
      const code = generateTotp(other);
      expect(verifyTotp(SECRET, code)).toBe(false);
    });

    it('rejects malformed tokens (non-numeric)', () => {
      expect(verifyTotp(SECRET, 'abcdef')).toBe(false);
    });

    it('rejects malformed tokens (wrong length)', () => {
      expect(verifyTotp(SECRET, '12')).toBe(false);
    });

    it('accepts a code from the previous window (drift tolerance)', () => {
      const now = Date.now();
      vi.useFakeTimers();
      try {
        vi.setSystemTime(now);
        const previousCode = generateTotp(SECRET);
        vi.setSystemTime(now + 30_000);
        expect(verifyTotp(SECRET, previousCode)).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });

    it('rejects a code beyond drift window', () => {
      const now = Date.now();
      vi.useFakeTimers();
      try {
        vi.setSystemTime(now);
        const oldCode = generateTotp(SECRET);
        vi.setSystemTime(now + 30_000 * 5);
        expect(verifyTotp(SECRET, oldCode)).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('otpauth URI', () => {
    it('builds a valid otpauth URI', () => {
      const uri = buildOtpAuthUri({
        secret: 'JBSWY3DPEHPK3PXP',
        accountName: 'admin@example.com',
        issuer: 'SofLIA',
      });
      expect(uri).toMatch(/^otpauth:\/\/totp\/SofLIA:admin%40example\.com\?/u);
      expect(uri).toContain('secret=JBSWY3DPEHPK3PXP');
      expect(uri).toContain('issuer=SofLIA');
      expect(uri).toContain('algorithm=SHA1');
      expect(uri).toContain('digits=6');
      expect(uri).toContain('period=30');
    });
  });

  describe('provisioning', () => {
    it('returns secret and uri', () => {
      const provisioning = createProvisioning({
        accountName: 'admin@example.com',
        issuer: 'SofLIA',
      });
      expect(provisioning.secret).toMatch(/^[A-Z2-7]+$/u);
      expect(provisioning.uri).toContain(`secret=${provisioning.secret}`);
    });
  });

  describe('recovery codes', () => {
    it('returns the requested number of codes', () => {
      const codes = generateRecoveryCodes(5);
      expect(codes).toHaveLength(5);
      codes.forEach((code) => expect(code).toMatch(/^[A-Z2-7]+$/u));
    });

    it('returns unique codes', () => {
      const codes = generateRecoveryCodes(20);
      expect(new Set(codes).size).toBe(20);
    });
  });
});

afterEach(() => {
  vi.useRealTimers();
});

beforeEach(() => {});
