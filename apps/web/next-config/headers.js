const {
  NO_INDEX_HEADER,
  PRIVATE_ROUTE_SOURCES,
  STATIC_CACHE_ROUTES,
  privateRouteHeaders,
  staticCacheHeaders,
} = require('./header-routes');
const { securityHeaders } = require('./security-headers');

async function headers() {
  return [
    {
      source: '/api/:path*',
      headers: [NO_INDEX_HEADER],
    },
    ...PRIVATE_ROUTE_SOURCES.map(privateRouteHeaders),
    ...STATIC_CACHE_ROUTES.map(staticCacheHeaders),
    {
      source: '/:path*',
      headers: securityHeaders(),
    },
  ];
}

module.exports = { headers };
