import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { OAuthService } from '../oauth.service';

vi.mock('../../../../lib/supabase/admin', () => ({ createAdminClient: vi.fn() }));
vi.mock('../supabase-auth-bridge.service', () => ({
  createSupabaseAuthUserRecord: vi.fn(),
  deleteSupabaseAuthUser: vi.fn(),
}));

const linkedUser = {
  id: 'original-user',
  email: 'person@new.example',
  username: 'original',
  platform_role: 'Administrador',
};

function mockDatabase(accountResult: object, userResult: object = { data: linkedUser, error: null }) {
  function query(result: object) {
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue(result),
    };
  }
  const accounts = query(accountResult);
  const users = query(userResult);
  const from = vi.fn((table: string) => {
    if (table === 'oauth_accounts') return accounts;
    if (table === 'users') return users;
    throw new Error(`Unexpected table: ${table}`);
  });
  vi.mocked(createAdminClient).mockReturnValue({ from } as unknown as ReturnType<typeof createAdminClient>);
  return { accounts, users, from };
}

describe('OAuth identity resolution', () => {
  beforeEach(() => vi.restoreAllMocks());

  it.each(['google', 'microsoft'] as const)(
    'preserves the linked user after an email change with %s',
    async (provider) => {
      const db = mockDatabase({ data: { user_id: linkedUser.id }, error: null });
      const emailLookup = vi.spyOn(OAuthService, 'findUserByEmail');

      const result = await OAuthService.resolveOAuthUser(provider, 'stable-id', 'person@old.example', 'organization');

      expect(result).toEqual(linkedUser);
      expect(db.accounts.eq).toHaveBeenCalledWith('provider', provider);
      expect(db.accounts.eq).toHaveBeenCalledWith('provider_account_id', 'stable-id');
      expect(db.users.eq).toHaveBeenCalledWith('id', linkedUser.id);
      expect(emailLookup).not.toHaveBeenCalled();
    }
  );

  it('does not switch to another user with the returned email', async () => {
    mockDatabase({ data: { user_id: linkedUser.id }, error: null });
    const emailLookup = vi.spyOn(OAuthService, 'findUserByEmail').mockResolvedValue({
      ...linkedUser, id: 'different-user', email: 'person@old.example',
    });

    await expect(OAuthService.resolveOAuthUser('google', 'stable-id', 'person@old.example'))
      .resolves.toEqual(linkedUser);
    expect(emailLookup).not.toHaveBeenCalled();
  });

  it.each([linkedUser, null])('uses email lookup only when no provider link exists (%j)', async (user) => {
    const db = mockDatabase({ data: null, error: null });
    const emailLookup = vi.spyOn(OAuthService, 'findUserByEmail').mockResolvedValue(user);

    await expect(OAuthService.resolveOAuthUser('google', 'new-id', 'person@new.example', 'organization'))
      .resolves.toEqual(user);
    expect(emailLookup).toHaveBeenCalledWith('person@new.example', 'organization');
    expect(db.from).not.toHaveBeenCalledWith('users');
  });

  it.each([
    { code: 'PGRST116', message: 'Multiple rows returned' },
    { code: '42501', message: 'Permission denied' },
  ])('does not fall back to email when provider lookup fails: $code', async (error) => {
    mockDatabase({ data: null, error });
    const emailLookup = vi.spyOn(OAuthService, 'findUserByEmail');

    await expect(OAuthService.resolveOAuthUser('google', 'stable-id', linkedUser.email))
      .rejects.toThrow('Error buscando cuenta OAuth');
    expect(emailLookup).not.toHaveBeenCalled();
  });

  it.each([
    { data: null, error: null },
    { data: null, error: { message: 'Database unavailable' } },
  ])('does not reassign a link when the linked profile cannot be loaded (%j)', async (result) => {
    mockDatabase({ data: { user_id: linkedUser.id }, error: null }, result);
    const emailLookup = vi.spyOn(OAuthService, 'findUserByEmail');

    await expect(OAuthService.resolveOAuthUser('google', 'stable-id', linkedUser.email)).rejects.toThrow();
    expect(emailLookup).not.toHaveBeenCalled();
  });

  it('rejects a missing provider identity before querying the database', async () => {
    const db = mockDatabase({ data: null, error: null });
    await expect(OAuthService.resolveOAuthUser('google', ' ', linkedUser.email))
      .rejects.toThrow('Identificador de cuenta OAuth no disponible');
    expect(db.from).not.toHaveBeenCalled();
  });
});
