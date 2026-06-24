const NO_INDEX_HEADER = {
  key: 'X-Robots-Tag',
  value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
};

const NO_STORE_HEADER = {
  key: 'Cache-Control',
  value: 'private, no-store, max-age=0',
};

const PRIVATE_ROUTE_SOURCES = [
  '/api/security/:path*',
  '/admin/:path*',
  '/auth/:path*',
  '/dashboard/:path*',
  '/profile/:path*',
  '/account-settings/:path*',
  '/study-planner/:path*',
  '/certificates/:path*',
  '/business-panel/:path*',
  '/business-user/:path*',
  '/:orgSlug/business-panel/:path*',
  '/:orgSlug/business-user/:path*',
  '/verification',
];

const STATIC_CACHE_ROUTES = [
  '/_next/static/:path*',
  '/_next/static/chunks/:path*',
];

// Short-lived private cache for user-specific API data that rarely changes.
// Reduces repeat round-trips on navigation without exposing stale security-critical state.
const SHORT_CACHE_API_ROUTES = [
  '/api/users/organizations',
];

const SHORT_CACHE_HEADER = {
  key: 'Cache-Control',
  value: 'private, max-age=120, stale-while-revalidate=60',
};

function shortCacheApiHeaders(source) {
  return {
    source,
    headers: [SHORT_CACHE_HEADER],
  };
}

function privateRouteHeaders(source) {
  return {
    source,
    headers: [NO_INDEX_HEADER, NO_STORE_HEADER],
  };
}

function staticCacheHeaders(source) {
  return {
    source,
    headers: [
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable',
      },
    ],
  };
}

module.exports = {
  NO_INDEX_HEADER,
  PRIVATE_ROUTE_SOURCES,
  STATIC_CACHE_ROUTES,
  SHORT_CACHE_API_ROUTES,
  privateRouteHeaders,
  staticCacheHeaders,
  shortCacheApiHeaders,
};
