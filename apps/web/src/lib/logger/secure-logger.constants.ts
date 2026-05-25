export const REDACTED = '[REDACTED]';

export const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'password_hash',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'apiKey',
  'api_key',
  'secret',
  'privateKey',
  'private_key',
  'jwt',
  'token',
  'authorization',
  'cookie',
  'sessionId',
  'session_id',
  'ssn',
  'creditCard',
  'credit_card',
  'cvv',
  'pin',
] as const;

export const SENSITIVE_PATTERNS = [
  /Bearer\s+[\w\-._~+/]+=*/gi,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  /\b\d{3}-\d{2}-\d{4}\b/g,
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
];
