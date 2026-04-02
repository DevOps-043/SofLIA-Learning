import { describe, expect, it } from 'vitest';
import type { InviteTranslate } from '../types';
import {
  buildInviteRoleLabels,
  buildInviteStatusConfig,
  createDefaultBulkInviteForm,
  createDefaultExpiry,
  createDefaultIndividualInviteForm,
  normalizeInviteLinkRecord,
  normalizeInviteLinkRecords,
} from '../utils';

const t = ((_: string, fallback = '') => fallback) as InviteTranslate;

describe('unified invite modal utils', () => {
  it('creates the default expiry seven days ahead', () => {
    expect(createDefaultExpiry(new Date('2026-04-01T12:30:00.000Z'))).toBe(
      '2026-04-08T12:30'
    );
  });

  it('creates the default forms with sane defaults', () => {
    expect(createDefaultIndividualInviteForm()).toEqual({
      customMessage: '',
      email: '',
      position: '',
      role: 'member',
    });

    expect(createDefaultBulkInviteForm(new Date('2026-04-01T00:00:00.000Z'))).toEqual({
      expiresAt: '2026-04-08T00:00',
      maxUses: 100,
      name: '',
      role: 'member',
    });
  });

  it('builds role labels from the translation callback', () => {
    expect(buildInviteRoleLabels(t).admin).toEqual({
      desc: 'Puede gestionar usuarios y contenido',
      label: 'Administrador',
    });
  });

  it('normalizes snake_case and camelCase invite link records', () => {
    expect(
      normalizeInviteLinkRecord({
        createdAt: '2026-04-01T00:00:00.000Z',
        expiresAt: '2026-04-10T00:00:00.000Z',
        id: 'link-1',
        maxUses: 20,
        name: 'Ventas',
        role: 'admin',
        status: 'paused',
        token: 'abc',
        usedCount: 3,
      })
    ).toEqual({
      created_at: '2026-04-01T00:00:00.000Z',
      current_uses: 3,
      expires_at: '2026-04-10T00:00:00.000Z',
      id: 'link-1',
      max_uses: 20,
      name: 'Ventas',
      role: 'admin',
      status: 'paused',
      token: 'abc',
    });

    expect(
      normalizeInviteLinkRecords([
        {
          created_at: '2026-04-01T00:00:00.000Z',
          current_uses: 2,
          expires_at: '2026-04-05T00:00:00.000Z',
          id: 'link-2',
          max_uses: 10,
          name: null,
          role: 'member',
          status: 'active',
          token: 'xyz',
        },
      ])
    ).toHaveLength(1);
  });

  it('builds consistent invite status configs', () => {
    expect(
      buildInviteStatusConfig(t, 'active', 'muted', 'input-bg')
    ).toMatchObject({
      bgColor: 'rgba(34, 197, 94, 0.1)',
      color: '#22C55E',
      label: 'Activo',
    });

    expect(
      buildInviteStatusConfig(t, 'custom', 'muted', 'input-bg')
    ).toMatchObject({
      bgColor: 'input-bg',
      color: 'muted',
      label: 'custom',
    });
  });
});
