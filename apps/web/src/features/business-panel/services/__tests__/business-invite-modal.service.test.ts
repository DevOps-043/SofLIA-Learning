import { describe, expect, it } from 'vitest';
import {
  getBusinessInviteStatusConfig,
  getBusinessInviteTabs,
  getBusinessInviteUrl,
  getDefaultBusinessInviteExpiry,
} from '../business-invite-modal.service';

describe('business-invite-modal.service', () => {
  it('builds the default expiry seven days ahead', () => {
    const expiry = getDefaultBusinessInviteExpiry(new Date('2026-04-01T10:00:00.000Z'));
    expect(expiry.startsWith('2026-04-08T10:00')).toBe(true);
  });

  it('formats invite urls and tabs', () => {
    expect(getBusinessInviteUrl('https://example.com', 'abc')).toBe('https://example.com/invite/abc');
    expect(getBusinessInviteTabs(3)[2]).toEqual({
      id: 'manage',
      label: 'Administrar Enlaces',
      icon: 'Users',
      badge: 3,
    });
  });

  it('maps invite status metadata', () => {
    expect(getBusinessInviteStatusConfig('active', '#fff', '#000')).toMatchObject({
      label: 'Activo',
      icon: 'check-circle',
    });
    expect(getBusinessInviteStatusConfig('custom', '#fff', '#000')).toMatchObject({
      label: 'custom',
      color: '#fff',
      bgColor: '#000',
      icon: 'alert-circle',
    });
  });
});
