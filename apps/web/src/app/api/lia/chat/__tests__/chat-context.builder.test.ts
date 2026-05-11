import { describe, expect, it, vi } from 'vitest';
import { buildFullContext } from '../chat-context.builder';

vi.mock('server-only', () => ({}));

describe('buildFullContext', () => {
  it('keeps the server-verified user name when the client sends a role as userName', async () => {
    const context = await buildFullContext(
      {
        userName: 'Israel Martinez',
        userJobTitle: 'Marketing',
        organizationId: 'org-1',
        coursesWithContent: [],
      },
      {
        userId: 'user-1',
        userName: 'Admin',
        userJobTitle: 'Admin',
        organizationId: 'org-1',
      },
    );

    expect(context.userName).toBe('Israel Martinez');
    expect(context.userJobTitle).toBe('Marketing');
  });
});
