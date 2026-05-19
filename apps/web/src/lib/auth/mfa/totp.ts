import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const DEFAULT_DIGITS = 6;
const DEFAULT_PERIOD_SECONDS = 30;
const DEFAULT_ALGORITHM = 'sha1' as const;
const DEFAULT_DRIFT_WINDOWS = 1;
const SECRET_BYTES = 20;

export type TotpAlgorithm = 'sha1' | 'sha256' | 'sha512';

export interface TotpOptions {
  digits?: number;
  period?: number;
  algorithm?: TotpAlgorithm;
}

export interface TotpVerifyOptions extends TotpOptions {
  driftWindows?: number;
}

export interface TotpProvisioning {
  secret: string;
  uri: string;
}

export function encodeBase32(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }
  return output;
}

export function decodeBase32(encoded: string): Buffer {
  const cleaned = encoded.replace(/=+$/u, '').replace(/\s+/gu, '').toUpperCase();
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of cleaned) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error('INVALID_BASE32_CHARACTER');
    }
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function generateSecret(bytes = SECRET_BYTES): string {
  return encodeBase32(randomBytes(bytes));
}

function counterBuffer(counter: number): Buffer {
  const buffer = Buffer.alloc(8);
  for (let i = 7; i >= 0; i--) {
    buffer[i] = counter & 0xff;
    counter = Math.floor(counter / 256);
  }
  return buffer;
}

function hotp(
  secret: Buffer,
  counter: number,
  digits: number,
  algorithm: TotpAlgorithm,
): string {
  const hmac = createHmac(algorithm, secret).update(counterBuffer(counter)).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const code = binary % 10 ** digits;
  return code.toString().padStart(digits, '0');
}

function getCounter(period: number, timestampMs: number): number {
  return Math.floor(timestampMs / 1000 / period);
}

export function generateTotp(secret: string, options: TotpOptions = {}): string {
  const digits = options.digits ?? DEFAULT_DIGITS;
  const period = options.period ?? DEFAULT_PERIOD_SECONDS;
  const algorithm = options.algorithm ?? DEFAULT_ALGORITHM;
  const counter = getCounter(period, Date.now());
  return hotp(decodeBase32(secret), counter, digits, algorithm);
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return timingSafeEqual(bufferA, bufferB);
}

export function verifyTotp(
  secret: string,
  token: string,
  options: TotpVerifyOptions = {},
): boolean {
  if (!/^\d{4,8}$/u.test(token)) return false;
  const digits = options.digits ?? DEFAULT_DIGITS;
  const period = options.period ?? DEFAULT_PERIOD_SECONDS;
  const algorithm = options.algorithm ?? DEFAULT_ALGORITHM;
  const driftWindows = options.driftWindows ?? DEFAULT_DRIFT_WINDOWS;
  const key = decodeBase32(secret);
  const baseCounter = getCounter(period, Date.now());
  for (let offset = -driftWindows; offset <= driftWindows; offset++) {
    const candidate = hotp(key, baseCounter + offset, digits, algorithm);
    if (constantTimeEqual(candidate, token)) return true;
  }
  return false;
}

export function buildOtpAuthUri(input: {
  secret: string;
  accountName: string;
  issuer: string;
  digits?: number;
  period?: number;
  algorithm?: TotpAlgorithm;
}): string {
  const params = new URLSearchParams({
    secret: input.secret,
    issuer: input.issuer,
    algorithm: (input.algorithm ?? DEFAULT_ALGORITHM).toUpperCase(),
    digits: String(input.digits ?? DEFAULT_DIGITS),
    period: String(input.period ?? DEFAULT_PERIOD_SECONDS),
  });
  const label = `${encodeURIComponent(input.issuer)}:${encodeURIComponent(input.accountName)}`;
  return `otpauth://totp/${label}?${params.toString()}`;
}

export function createProvisioning(input: {
  accountName: string;
  issuer: string;
  options?: TotpOptions;
}): TotpProvisioning {
  const secret = generateSecret();
  const uri = buildOtpAuthUri({
    secret,
    accountName: input.accountName,
    issuer: input.issuer,
    digits: input.options?.digits,
    period: input.options?.period,
    algorithm: input.options?.algorithm,
  });
  return { secret, uri };
}

export function generateRecoveryCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = randomBytes(5);
    codes.push(encodeBase32(bytes).replace(/=+$/u, ''));
  }
  return codes;
}
