import {
  REDACTED,
  SENSITIVE_FIELDS,
  SENSITIVE_PATTERNS,
} from './secure-logger.constants';

export function sanitizeData<T>(data: T, deep: boolean = true): T {
  if (!data || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, deep)) as T;
  }

  const sanitized: Record<string, unknown> = {};
  const record = data as Record<string, unknown>;

  for (const key in record) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) continue;

    const lowerKey = key.toLowerCase();
    const value = record[key];

    if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
      sanitized[key] = REDACTED;
      continue;
    }

    if (deep && value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeData(value, deep);
    } else if (typeof value === 'string') {
      sanitized[key] = redactSensitivePatterns(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

export function redactSensitivePatterns(text: string): string {
  if (typeof text !== 'string') return text;

  let redacted = text;
  for (const pattern of SENSITIVE_PATTERNS) {
    redacted = redacted.replace(pattern, REDACTED);
  }
  return redacted;
}

export function sanitizeStackTrace(stack?: string): string | undefined {
  if (!stack) return undefined;

  let sanitized = stack.replace(/\/[\w\-./]+\//g, '[PATH]/');
  sanitized = sanitized.replace(/[A-Z]:\\[\w\-\\/.]+\\/g, '[PATH]\\');

  return sanitized.split('\n').slice(0, 5).join('\n');
}
