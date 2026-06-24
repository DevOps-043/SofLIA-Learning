const {
  NO_INDEX_HEADER,
  PRIVATE_ROUTE_SOURCES,
  STATIC_CACHE_ROUTES,
  SHORT_CACHE_API_ROUTES,
  privateRouteHeaders,
  staticCacheHeaders,
  shortCacheApiHeaders,
} = require('./header-routes');
const { securityHeaders } = require('./security-headers');

async function headers() {
  return [
    {
      source: '/api/:path*',
      headers: [NO_INDEX_HEADER],
    },
    ...SHORT_CACHE_API_ROUTES.map(shortCacheApiHeaders),
    ...PRIVATE_ROUTE_SOURCES.map(privateRouteHeaders),
    ...STATIC_CACHE_ROUTES.map(staticCacheHeaders),
    {
      source: '/:path*',
      headers: securityHeaders(),
    },
  ];
}

module.exports = { headers };
