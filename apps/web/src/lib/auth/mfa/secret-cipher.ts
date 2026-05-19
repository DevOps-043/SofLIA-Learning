import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

function deriveKey(): Buffer {
  const raw = process.env.MFA_SECRET_KEY;
  if (!raw || raw.length < 32) {
    throw new Error('MFA_SECRET_KEY env var is missing or shorter than 32 chars');
  }
  return createHash('sha256').update(raw).digest();
}

export function encryptSecret(plaintext: string): Buffer {
  const key = deriveKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]);
}

export function decryptSecret(encrypted: Buffer): string {
  if (encrypted.length < IV_BYTES + AUTH_TAG_BYTES) {
    throw new Error('MFA_CIPHERTEXT_TOO_SHORT');
  }
  const key = deriveKey();
  const iv = encrypted.subarray(0, IV_BYTES);
  const authTag = encrypted.subarray(IV_BYTES, IV_BYTES + AUTH_TAG_BYTES);
  const ciphertext = encrypted.subarray(IV_BYTES + AUTH_TAG_BYTES);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}

export function hashRecoveryCode(code: string): string {
  return createHash('sha256').update(code.toUpperCase().trim()).digest('hex');
}

export function constantTimeCompareHash(candidate: string, stored: string): boolean {
  if (candidate.length !== stored.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) {
    diff |= candidate.charCodeAt(i) ^ stored.charCodeAt(i);
  }
  return diff === 0;
}
