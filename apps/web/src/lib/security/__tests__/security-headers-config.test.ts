import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { securityHeaders } = require('../../../../next-config/security-headers.js') as {
  securityHeaders: () => Array<{ key: string; value: string }>;
};

describe('security headers config', () => {
  it('delegates CSP to nonce-aware middleware instead of emitting a conflicting static policy', () => {
    const keys = securityHeaders().map(({ key }) => key.toLowerCase());

    expect(keys).not.toContain('content-security-policy');
    expect(keys).not.toContain('content-security-policy-report-only');
    expect(keys).toContain('reporting-endpoints');
  });
});
