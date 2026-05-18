import { afterEach, describe, expect, it, vi } from 'vitest';

import { SecureLogger } from './secure-logger.class';

describe('SecureLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('redacts emails and bearer tokens before writing logs', () => {
    const sink = vi.spyOn(globalThis.console, 'error').mockImplementation(() => undefined);
    const logger = new SecureLogger('LoggerTest');

    logger.error('Token Bearer abc.def.ghi for admin@example.com', {
      email: 'admin@example.com',
      accessToken: 'secret-token',
      nested: {
        refresh_token: 'refresh-secret',
      },
    });

    const payload = String(sink.mock.calls[0]?.[0]);
    expect(payload).not.toContain('admin@example.com');
    expect(payload).not.toContain('secret-token');
    expect(payload).not.toContain('refresh-secret');
    expect(payload).toContain('[REDACTED]');
  });

  it('keeps debug silent outside development', () => {
    const sink = vi.spyOn(globalThis.console, 'log').mockImplementation(() => undefined);
    vi.stubEnv('NODE_ENV', 'production');

    new SecureLogger('LoggerTest').debug('Debug details', { token: 'secret' });

    expect(sink).not.toHaveBeenCalled();
  });
});
