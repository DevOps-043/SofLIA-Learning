import { describe, it, expect } from 'vitest';
import {
  UPLOAD_CONFIG,
  validateFile,
  sanitizePath,
  validateBucket,
  generateSafeFileName,
} from '../upload/validation';

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeFile(name: string, type: string, size: number): File {
  const blob = new Blob(['x'.repeat(size)], { type });
  return new File([blob], name, { type });
}

// ─── UPLOAD_CONFIG ────────────────────────────────────────────────────────────

describe('UPLOAD_CONFIG', () => {
  it('maxFileSize is 10MB', () => {
    expect(UPLOAD_CONFIG.maxFileSize).toBe(10 * 1024 * 1024);
  });

  it('image mime types include jpeg, png, gif, webp', () => {
    expect(UPLOAD_CONFIG.allowedMimeTypes.images).toContain('image/jpeg');
    expect(UPLOAD_CONFIG.allowedMimeTypes.images).toContain('image/png');
    expect(UPLOAD_CONFIG.allowedMimeTypes.images).toContain('image/gif');
    expect(UPLOAD_CONFIG.allowedMimeTypes.images).toContain('image/webp');
  });

  it('bucket whitelist contains expected buckets', () => {
    expect(UPLOAD_CONFIG.bucketWhitelist).toContain('avatars');
    expect(UPLOAD_CONFIG.bucketWhitelist).toContain('content-images');
    expect(UPLOAD_CONFIG.bucketWhitelist).toContain('documents');
  });
});

// ─── validateFile ─────────────────────────────────────────────────────────────

describe('validateFile', () => {
  it('returns valid for valid jpeg image', () => {
    const file = makeFile('photo.jpg', 'image/jpeg', 1024);
    const result = validateFile(file);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('returns valid for valid png image', () => {
    const file = makeFile('image.png', 'image/png', 512);
    const result = validateFile(file);
    expect(result.valid).toBe(true);
  });

  it('returns invalid when file exceeds maxSize', () => {
    const bigFile = makeFile('big.jpg', 'image/jpeg', UPLOAD_CONFIG.maxFileSize + 1);
    const result = validateFile(bigFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('10MB');
  });

  it('returns invalid for disallowed mime type', () => {
    const file = makeFile('script.js', 'application/javascript', 100);
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('application/javascript');
  });

  it('returns invalid for disallowed extension', () => {
    const file = makeFile('document.docx', 'application/pdf', 100);
    const result = validateFile(file);
    expect(result.valid).toBe(false);
  });

  it('returns invalid when extension does not match mime type (spoofing)', () => {
    // image/jpeg with .png extension
    const file = makeFile('photo.png', 'image/jpeg', 100);
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('extensión no coincide');
  });

  it('respects custom allowedTypes option', () => {
    const file = makeFile('photo.jpg', 'image/jpeg', 100);
    const result = validateFile(file, { allowedTypes: ['image/png'] });
    expect(result.valid).toBe(false);
  });

  it('respects custom maxSize option', () => {
    const file = makeFile('small.jpg', 'image/jpeg', 500);
    const result = validateFile(file, { maxSize: 100 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Archivo muy grande');
  });

  it('returns valid for pdf document', () => {
    const file = makeFile('report.pdf', 'application/pdf', 1024);
    const result = validateFile(file);
    expect(result.valid).toBe(true);
  });

  it('returns valid for jpeg with .jpeg extension', () => {
    const file = makeFile('photo.jpeg', 'image/jpeg', 100);
    const result = validateFile(file);
    expect(result.valid).toBe(true);
  });
});

// ─── sanitizePath ─────────────────────────────────────────────────────────────

describe('sanitizePath', () => {
  it('returns empty string for falsy input', () => {
    expect(sanitizePath('')).toBe('');
    expect(sanitizePath(null as any)).toBe('');
  });

  it('removes path traversal sequences (../)', () => {
    const result = sanitizePath('../../../etc/passwd');
    expect(result).not.toContain('..');
  });

  it('removes leading slashes', () => {
    const result = sanitizePath('/etc/passwords');
    expect(result).not.toMatch(/^\//);
  });

  it('normalizes multiple slashes to single slash', () => {
    const result = sanitizePath('folder//subfolder///file');
    expect(result).not.toContain('//');
  });

  it('replaces backslashes with forward slashes', () => {
    const result = sanitizePath('folder\\subfolder\\file');
    expect(result).toContain('/');
  });

  it('replaces dangerous characters with underscore', () => {
    const result = sanitizePath('file name with spaces.txt');
    expect(result).not.toContain(' ');
  });

  it('preserves safe path characters', () => {
    const result = sanitizePath('avatars/user-123/photo.jpg');
    // Should mostly preserve the structure
    expect(result).toContain('avatars');
    expect(result).toContain('user-123');
  });

  it('removes null bytes and special chars', () => {
    const result = sanitizePath('file\x00name.txt');
    expect(result).not.toContain('\x00');
  });
});

// ─── validateBucket ───────────────────────────────────────────────────────────

describe('validateBucket', () => {
  it('returns valid for "avatars"', () => {
    expect(validateBucket('avatars').valid).toBe(true);
  });

  it('returns valid for "content-images"', () => {
    expect(validateBucket('content-images').valid).toBe(true);
  });

  it('returns valid for "documents"', () => {
    expect(validateBucket('documents').valid).toBe(true);
  });

  it('returns valid for "community-images"', () => {
    expect(validateBucket('community-images').valid).toBe(true);
  });

  it('returns invalid for empty string', () => {
    const result = validateBucket('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('requerido');
  });

  it('returns invalid for disallowed bucket', () => {
    const result = validateBucket('private-bucket');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('no permitido');
  });

  it('lists allowed buckets in error message', () => {
    const result = validateBucket('unknown');
    expect(result.error).toContain('avatars');
  });
});

// ─── generateSafeFileName ─────────────────────────────────────────────────────

describe('generateSafeFileName', () => {
  it('returns a non-empty string', () => {
    const result = generateSafeFileName('photo.jpg');
    expect(result.length).toBeGreaterThan(0);
  });

  it('preserves original file extension', () => {
    expect(generateSafeFileName('photo.jpg')).toMatch(/\.jpg$/);
    expect(generateSafeFileName('document.pdf')).toMatch(/\.pdf$/);
    expect(generateSafeFileName('image.PNG')).toMatch(/\.png$/);
  });

  it('generates unique filenames for same input', () => {
    const a = generateSafeFileName('photo.jpg');
    const b = generateSafeFileName('photo.jpg');
    // Should be different due to timestamp/random
    expect(a).not.toBe(b);
  });

  it('uses "bin" extension for files without extension', () => {
    const result = generateSafeFileName('noextension');
    expect(result).toMatch(/\.bin$/);
  });

  it('includes timestamp-like number prefix', () => {
    const result = generateSafeFileName('file.txt');
    // Format: timestamp-randomstring.ext
    expect(result).toMatch(/^\d+-[a-z0-9]+-?[a-z0-9]+\.\w+$/);
  });
});
