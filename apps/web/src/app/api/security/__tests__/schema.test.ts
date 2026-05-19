import { describe, expect, it } from 'vitest';

import {
  agentHandshakeSchema,
  automationSignalSchema,
  cspReportSchema,
} from '../_schemas';

describe('security schemas', () => {
  it('accepts minimal trusted agent handshake payloads', () => {
    const result = agentHandshakeSchema.safeParse({
      agentId: 'codex-desktop',
      method: 'POST',
      pathname: '/api/reels',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid automation signal counts', () => {
    const result = automationSignalSchema.safeParse({
      cdcArtifacts: -1,
    });

    expect(result.success).toBe(false);
  });

  it('accepts W3C CSP report-uri payloads without reshaping', () => {
    const payload = {
      'csp-report': {
        'blocked-uri': 'https://example.com/script.js',
        'document-uri': 'https://app.soflia.com',
      },
    };

    const result = cspReportSchema.safeParse(payload);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(payload);
    }
  });
});
