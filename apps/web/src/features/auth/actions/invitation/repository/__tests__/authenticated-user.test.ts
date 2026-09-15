import { describe, expect, it } from 'vitest'

import { resolveAuthenticatedUserId } from '../authenticated-user'

describe('resolveAuthenticatedUserId', () => {
  it('preserves the Supabase auth receiver when resolving a native session', async () => {
    const auth = {
      expectedUserId: 'native-user-1',
      async getUser() {
        return { data: { user: { id: this.expectedUserId } } }
      },
    }

    await expect(resolveAuthenticatedUserId({ auth })).resolves.toBe(
      'native-user-1',
    )
  })
})
