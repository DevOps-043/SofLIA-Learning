interface RateLimitEntry {
  count: number;
  timestamp: number;
}

const requestAttempts = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;

export const MAX_REQUEST_ATTEMPTS = 3;
export const MAX_RESET_ATTEMPTS = 5;

export function getClientIP(): string {
  return 'unknown';
}

export function checkRateLimit(
  ip: string,
  maxAttempts: number
): { limited: boolean; remainingTime?: number } {
  const now = Date.now();
  const userAttempts = requestAttempts.get(ip);

  if (!userAttempts) {
    return { limited: false };
  }

  if (now - userAttempts.timestamp > RATE_LIMIT_WINDOW) {
    requestAttempts.delete(ip);
    return { limited: false };
  }

  if (userAttempts.count >= maxAttempts) {
    return {
      limited: true,
      remainingTime: RATE_LIMIT_WINDOW - (now - userAttempts.timestamp),
    };
  }

  return { limited: false };
}

export function recordResetAttempt(ip: string): void {
  const now = Date.now();
  const userAttempts = requestAttempts.get(ip);

  if (!userAttempts || now - userAttempts.timestamp > RATE_LIMIT_WINDOW) {
    requestAttempts.set(ip, { count: 1, timestamp: now });
    return;
  }

  userAttempts.count++;
}

export function buildRateLimitError(remainingTime = 0): { error: string } {
  const minutes = Math.ceil(remainingTime / 60000);
  return { error: `Demasiados intentos. Intenta de nuevo en ${minutes} minutos.` };
}
