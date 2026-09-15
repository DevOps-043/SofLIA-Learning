import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { BulkInviteForm, IndividualInviteForm } from '../../types';
import { InviteRoleSelector } from '../InviteRoleSelector';

const roleLabels = {
  admin: { desc: 'Gestiona usuarios', label: 'Administrador' },
  member: { desc: 'Acceso basico', label: 'Miembro' },
  owner: { desc: 'Control total', label: 'Propietario' },
};

const theme = {
  accentColor: '#22c55e',
  borderColor: '#e2e8f0',
  headerGradient: 'none',
  inputBg: '#ffffff',
  isDark: false,
  menuBg: '#ffffff',
  mutedText: '#64748b',
  onPrimaryColor: '#ffffff',
  primaryColor: '#0f172a',
  surfaceColor: '#ffffff',
  textColor: '#0f172a',
};

afterEach(cleanup);

describe('InviteRoleSelector', () => {
  it('shows only member for bearer-link forms', () => {
    const form: BulkInviteForm = {
      expiresAt: '2099-06-30T12:00',
      maxUses: 25,
      name: 'Ventas',
      role: 'member',
    };

    render(
      <InviteRoleSelector
        allowedRoles={['member']}
        form={form}
        onRoleChange={vi.fn()}
        roleLabels={roleLabels}
        status="idle"
        theme={theme}
      />,
    );

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Miembro/i })).toBeVisible();
    expect(
      screen.queryByRole('button', { name: /Administrador/i }),
    ).not.toBeInTheDocument();
  });

  it('keeps privileged choices available for email-bound invitations', () => {
    const form: IndividualInviteForm = {
      customMessage: '',
      email: 'user@example.com',
      position: '',
      role: 'member',
    };

    render(
      <InviteRoleSelector
        form={form}
        onRoleChange={vi.fn()}
        roleLabels={roleLabels}
        status="idle"
        theme={theme}
      />,
    );

    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(
      screen.getByRole('button', { name: /Administrador/i }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: /Propietario/i })).toBeVisible();
  });
});
