function buildContentSecurityPolicy() {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data: https://r2cdn.perplexity.ai",
    "img-src 'self' data: blob: https://*.supabase.co https://via.placeholder.com https://picsum.photos https://images.unsplash.com https://img.youtube.com https://*.googleusercontent.com https://*.basemaps.cartocdn.com https://raw.githubusercontent.com https://cdnjs.cloudflare.com https://unpkg.com https://*.tile.openstreetmap.org",
    "media-src 'self' blob: https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.elevenlabs.io https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com",
    "frame-src 'self' https://accounts.google.com https://www.youtube.com https://*.supabase.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

function securityHeaders() {
  const headers = [
    {
      key: 'X-DNS-Prefetch-Control',
      value: 'on',
    },
    {
      key: 'X-Permitted-Cross-Domain-Policies',
      value: 'none',
    },
    {
      key: 'Origin-Agent-Cluster',
      value: '?1',
    },
    {
      key: 'Content-Security-Policy',
      value: buildContentSecurityPolicy(),
    },
    {
      key: 'X-Frame-Options',
      value: 'DENY',
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
    },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(self), geolocation=(), interest-cohort=()',
    },
    {
      key: 'X-XSS-Protection',
      value: '1; mode=block',
    },
  ];

  if (process.env.NODE_ENV === 'production') {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    });
  }

  return headers;
}

module.exports = { securityHeaders };
