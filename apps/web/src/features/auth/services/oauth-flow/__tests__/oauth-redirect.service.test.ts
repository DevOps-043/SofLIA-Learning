import { describe, expect, it } from 'vitest';
import {
  buildBusinessDashboardDestination,
  isBusinessCargoRole,
  normalizeCargoRole,
  resolveOAuthDashboardDestination,
} from '../oauth-redirect.service';

interface StubSupabaseResponseMap {
  organization_users?: unknown;
  users?: unknown;
}

function createSupabaseStub(
  responses: StubSupabaseResponseMap,
  updates: unknown[] = []
) {
  return {
    from(tableName: string) {
      return {
        eq() {
          return this;
        },
        order: async () => ({
          data:
            tableName === 'organization_users'
              ? responses.organization_users
              : undefined,
        }),
        select() {
          return this;
        },
        single: async () => ({
          data: tableName === 'users' ? responses.users : undefined,
        }),
        update(payload: unknown) {
          updates.push({ payload, tableName });
          return this;
        },
      };
    },
  } as never;
}

describe('oauth-redirect.service', () => {
  it('normalizes cargo roles and identifies business roles', () => {
    expect(normalizeCargoRole(' Business User ')).toBe('business user');
    expect(isBusinessCargoRole('Business')).toBe(true);
    expect(isBusinessCargoRole('Usuario')).toBe(false);
  });

  it('builds business-panel routes for owner and admin roles', () => {
    expect(buildBusinessDashboardDestination('acme', 'owner')).toBe(
      '/acme/business-panel/dashboard'
    );
    expect(buildBusinessDashboardDestination('acme', 'admin')).toBe(
      '/acme/business-panel/dashboard'
    );
  });

  it('builds business-user routes for member roles', () => {
    expect(buildBusinessDashboardDestination('acme', 'member')).toBe(
      '/acme/business-user/dashboard'
    );
  });

  it('resolves admin and instructor dashboards without organization lookups', async () => {
    await expect(
      resolveOAuthDashboardDestination(
        createSupabaseStub({
          users: { cargo_rol: 'Administrador' },
        }),
        'user-1'
      )
    ).resolves.toBe('/admin/dashboard');

    await expect(
      resolveOAuthDashboardDestination(
        createSupabaseStub({
          users: { cargo_rol: 'Instructor' },
        }),
        'user-1'
      )
    ).resolves.toBe('/instructor/dashboard');
  });

  it('resolves business destinations using the active organization slug and role', async () => {
    await expect(
      resolveOAuthDashboardDestination(
        createSupabaseStub({
          organization_users: [
            {
              organizations: { slug: 'acme' },
              role: 'owner',
            },
          ],
          users: { cargo_rol: 'Business' },
        }),
        'user-1'
      )
    ).resolves.toBe('/acme/business-panel/dashboard');
  });

  it('sends business users with multiple active organizations to the selector', async () => {
    await expect(
      resolveOAuthDashboardDestination(
        createSupabaseStub({
          organization_users: [
            {
              organizations: { slug: 'acme' },
              role: 'owner',
            },
            {
              organizations: { slug: 'globex' },
              role: 'member',
            },
          ],
          users: { cargo_rol: 'Business' },
        }),
        'user-1'
      )
    ).resolves.toBe('/auth/select-organization');
  });

  it('treats active organization membership as source of truth for legacy Usuario roles', async () => {
    const updates: unknown[] = [];

    await expect(
      resolveOAuthDashboardDestination(
        createSupabaseStub(
          {
            organization_users: [
              {
                organizations: { slug: 'acme' },
                role: 'member',
              },
            ],
            users: { cargo_rol: 'Usuario' },
          },
          updates
        ),
        'user-1'
      )
    ).resolves.toBe('/acme/business-user/dashboard');

    expect(updates).toEqual([
      {
        payload: { cargo_rol: 'Business' },
        tableName: 'users',
      },
    ]);
  });

  it('falls back to /dashboard when no active organization is available', async () => {
    await expect(
      resolveOAuthDashboardDestination(
        createSupabaseStub({
          organization_users: [],
          users: { cargo_rol: 'Business User' },
        }),
        'user-1'
      )
    ).resolves.toBe('/dashboard');
  });
});
