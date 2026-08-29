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
    // CSP is intentionally absent here. It needs a fresh request nonce and is
    // emitted by src/middleware.ts. A static report-only policy contradicted
    // the enforced nonce policy and reported every valid Next.js inline script.
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
  securityHeaders,
};
