import { describe, expect, it } from 'vitest';

import {
  buildBusinessAuth,
  createAuthErrorResponse,
  evaluateBusinessRoleAccess,
  normalizeBusinessRole,
} from '../requireBusiness.helpers';

describe('requireBusiness shared helpers', () => {
  it('normalizes cargo roles before evaluating access', () => {
    expect(normalizeBusinessRole(' Business ')).toBe('business');
    expect(normalizeBusinessRole(' ADMINISTRADOR ')).toBe('administrador');
  });

  it('recognizes business and platform admin roles', () => {
    expect(evaluateBusinessRoleAccess('business')).toMatchObject({
      isAllowed: true,
      isBusiness: true,
      isPlatformAdmin: false,
    });

    expect(evaluateBusinessRoleAccess('administrador')).toMatchObject({
      isAllowed: true,
      isBusiness: false,
      isPlatformAdmin: true,
    });

    expect(evaluateBusinessRoleAccess('estudiante').isAllowed).toBe(false);
  });

  it('builds business auth payloads with admin inference', () => {
    expect(
      buildBusinessAuth(
        {
          id: 'user-1',
          email: 'owner@example.com',
          platform_role: 'Business',
        },
        {
          organizationId: 'org-1',
          organizationSlug: 'acme',
          organizationRole: 'owner',
        }
      )
    ).toMatchObject({
      userId: 'user-1',
      userEmail: 'owner@example.com',
      organizationRole: 'owner',
      isOrgAdmin: true,
    });

    expect(
      buildBusinessAuth(
        {
          id: 'user-2',
          email: 'member@example.com',
          platform_role: 'Business',
        },
        {
          organizationId: 'org-1',
          organizationRole: 'member',
        }
      ).isOrgAdmin
    ).toBe(false);
  });

  it('creates standardized auth error responses', async () => {
    const response = createAuthErrorResponse('No autenticado', 401);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'No autenticado',
    });
  });
});
