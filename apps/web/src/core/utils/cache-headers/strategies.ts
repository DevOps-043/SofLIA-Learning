export const staticCache = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  'CDN-Cache-Control': 'max-age=3600',
} as const

export const semiStaticCache = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  'CDN-Cache-Control': 'max-age=300',
} as const

export const dynamicCache = {
  'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
  'CDN-Cache-Control': 'max-age=30',
} as const

export const realtimeCache = {
  'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20',
  'CDN-Cache-Control': 'max-age=10',
} as const

export const privateCache = {
  'Cache-Control': 'private, no-cache, no-store, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
} as const

export const immutableCache = {
  'Cache-Control': 'public, max-age=31536000, immutable',
  'CDN-Cache-Control': 'max-age=31536000',
} as const

export type CacheStrategy =
  | typeof staticCache
  | typeof semiStaticCache
  | typeof dynamicCache
  | typeof realtimeCache
  | typeof privateCache
  | typeof immutableCache

export type CacheContentType =
  | 'static'
  | 'semi-static'
  | 'dynamic'
  | 'realtime'
  | 'private'
  | 'immutable'
