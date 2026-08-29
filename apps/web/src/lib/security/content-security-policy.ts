import { randomBytes } from 'node:crypto'

export function createContentSecurityPolicyNonce(): string {
  return randomBytes(16).toString('base64')
}

export function buildEnforcedContentSecurityPolicy(nonce: string): string {
  const developmentEvalSource =
    process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'${developmentEvalSource} https://accounts.google.com https://apis.google.com https://*.googleapis.com https://challenges.cloudflare.com https://js.hcaptcha.com`,
    `script-src-elem 'self' 'nonce-${nonce}' https://netlify-rum.netlify.app https://accounts.google.com https://apis.google.com https://*.googleapis.com https://challenges.cloudflare.com https://js.hcaptcha.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com https://r2cdn.perplexity.ai",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https://*.supabase.co",
    "connect-src 'self' blob: https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://challenges.cloudflare.com https://hcaptcha.com https://*.hcaptcha.com",
    "frame-src 'self' https://accounts.google.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://*.supabase.co https://challenges.cloudflare.com https://hcaptcha.com https://*.hcaptcha.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : []),
    'report-to csp-endpoint',
    'report-uri /api/csp-report',
  ].join('; ')
}
