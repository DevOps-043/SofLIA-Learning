function buildContentSecurityPolicy() {
  return [
    "default-src 'self'",
    "script-src 'self' 'wasm-unsafe-eval' https://accounts.google.com https://apis.google.com https://*.googleapis.com https://*.supabase.co https://challenges.cloudflare.com https://js.hcaptcha.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com https://r2cdn.perplexity.ai",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.elevenlabs.io https://generativelanguage.googleapis.com https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://challenges.cloudflare.com https://hcaptcha.com https://*.hcaptcha.com",
    "frame-src 'self' https://accounts.google.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://*.supabase.co https://challenges.cloudflare.com https://hcaptcha.com https://*.hcaptcha.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "report-to csp-endpoint",
    "report-uri /api/csp-report",
    ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

function getContentSecurityPolicyHeaderName() {
  return process.env.CSP_ENFORCEMENT === 'true'
    ? 'Content-Security-Policy'
    : 'Content-Security-Policy-Report-Only';
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
      key: getContentSecurityPolicyHeaderName(),
      value: buildContentSecurityPolicy(),
    },
    {
      key: 'Reporting-Endpoints',
      value: 'csp-endpoint="/api/csp-report"',
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
      value: '0',
    },
    {
      key: 'Cross-Origin-Opener-Policy',
      value: 'same-origin',
    },
    {
      key: 'Cross-Origin-Embedder-Policy',
      value: 'credentialless',
    },
    {
      key: 'Cross-Origin-Resource-Policy',
      value: 'same-site',
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

module.exports = {
  buildContentSecurityPolicy,
  getContentSecurityPolicyHeaderName,
  securityHeaders,
};
