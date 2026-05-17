export interface CacheEntry<T> {
  createdAt: number;
  data: T;
  ttl: number;
}

export interface CacheOptions {
  maxEntries?: number;
  pageTtl?: number;
  staticTtl?: number;
  userTtl?: number;
}
