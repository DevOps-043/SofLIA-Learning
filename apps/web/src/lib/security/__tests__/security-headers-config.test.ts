import { createRequire } from 'module';
import { afterEach, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const {
  buildContentSecurityPolicy,
  getContentSecurityPolicyHeaderName,
} = require('../../../../next-config/security-headers.js') as {
  buildContentSecurityPolicy: () => string;
  getContentSecurityPolicyHeaderName: () => string;
};

const originalCspEnforcement = process.env.CSP_ENFORCEMENT;

afterEach(() => {
  if (originalCspEnforcement === undefined) {
    delete process.env.CSP_ENFORCEMENT;
    return;
  }

  process.env.CSP_ENFORCEMENT = originalCspEnforcement;
});

describe('security headers config', () => {
  it('keeps CSP in report-only mode by default', () => {
    delete process.env.CSP_ENFORCEMENT;

    expect(getContentSecurityPolicyHeaderName()).toBe(
      'Content-Security-Policy-Report-Only'
    );
  });

  it('switches CSP to enforcement only when explicitly enabled', () => {
    process.env.CSP_ENFORCEMENT = 'true';

    expect(getContentSecurityPolicyHeaderName()).toBe(
      'Content-Security-Policy'
    );
  });

  it('reports CSP violations to the local endpoint', () => {
    const csp = buildContentSecurityPolicy();

    expect(csp).toContain('report-uri /api/csp-report');
    expect(csp).toContain('report-to csp-endpoint');
  });

  it('allows configured human verification providers in CSP', () => {
    const csp = buildContentSecurityPolicy();

    expect(csp).toContain('https://challenges.cloudflare.com');
    expect(csp).toContain('https://js.hcaptcha.com');
    expect(csp).toContain('https://*.hcaptcha.com');
  });
});
