export const cacheHeaders = {
  static: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    'CDN-Cache-Control': 'max-age=3600',
  },
  semiStatic: {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    'CDN-Cache-Control': 'max-age=300',
  },
  dynamic: {
    'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    'CDN-Cache-Control': 'max-age=30',
  },
  private: {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  },
  privateShort: {
    'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
  },
  privateMedium: {
    'Cache-Control': 'private, max-age=120, stale-while-revalidate=300',
  },
  noCache: {
    'Cache-Control': 'no-cache, must-revalidate',
    'CDN-Cache-Control': 'no-cache',
  },
} as const
