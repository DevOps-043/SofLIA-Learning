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

function createSupabaseStub(responses: StubSupabaseResponseMap) {
  return {
    from(tableName: string) {
      return {
        eq() {
          return this;
        },
        maybeSingle: async () => ({
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
          organization_users: {
            organizations: { slug: 'acme' },
            role: 'owner',
          },
          users: { cargo_rol: 'Business' },
        }),
        'user-1'
      )
    ).resolves.toBe('/acme/business-panel/dashboard');
  });

  it('falls back to /dashboard when no active organization is available', async () => {
    await expect(
      resolveOAuthDashboardDestination(
        createSupabaseStub({
          organization_users: null,
          users: { cargo_rol: 'Business User' },
        }),
        'user-1'
      )
    ).resolves.toBe('/dashboard');
  });
});
