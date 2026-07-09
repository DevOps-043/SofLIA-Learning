export enum RateLimitTier {
  AUTH = 'auth',
  ADMIN = 'admin',
  API_MUTATION = 'api_mutation',
  API_READ = 'api_read',
  AI_GENERATION = 'ai_generation',
  PUBLIC = 'public',
}

export interface RequestRecord {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  blockedUntil?: number;
}
