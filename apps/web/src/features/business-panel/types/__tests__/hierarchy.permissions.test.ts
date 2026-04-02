import { describe, expect, it } from 'vitest';
import {
  canAssignUsers,
  formatFullAddress,
  getDefaultScope,
  getManagerDisplayName,
  hasOrganizationAccess,
  isManagerRole,
  ROLE_LABELS,
  SCOPE_LABELS,
} from '../hierarchy.types';

describe('hierarchy permission helpers', () => {
  it('detects organization access and manager roles', () => {
    expect(hasOrganizationAccess('owner')).toBe(true);
    expect(hasOrganizationAccess('member')).toBe(false);
    expect(isManagerRole('regional_manager')).toBe(true);
    expect(isManagerRole('team_leader')).toBe(false);
  });

  it('computes assignment access by role and scope', () => {
    expect(canAssignUsers('owner', 'organization')).toBe(true);
    expect(canAssignUsers('admin', 'organization')).toBe(true);
    expect(canAssignUsers('admin', 'team')).toBe(false);
    expect(canAssignUsers('team_leader', 'team')).toBe(true);
    expect(canAssignUsers('member', 'team')).toBe(false);
  });

  it('returns the default scope for each role family', () => {
    expect(getDefaultScope('owner')).toBe('organization');
    expect(getDefaultScope('regional_manager')).toBe('region');
    expect(getDefaultScope('zone_manager')).toBe('zone');
    expect(getDefaultScope('member')).toBe('team');
  });

  it('formats addresses and display names safely', () => {
    expect(
      formatFullAddress({
        address: 'Av. Reforma 100',
        city: 'CDMX',
        country: 'MX',
        postal_code: '06000',
        state: 'CDMX',
      })
    ).toBe('Av. Reforma 100, CDMX, CDMX, 06000, MX');

    expect(formatFullAddress({})).toBe('Sin direccion');

    expect(
      getManagerDisplayName({
        display_name: 'Ana Perez',
        email: 'ana@example.com',
        id: '1',
      })
    ).toBe('Ana Perez');

    expect(
      getManagerDisplayName({
        email: 'ana@example.com',
        first_name: 'Ana',
        id: '2',
        last_name: 'Perez',
      })
    ).toBe('Ana Perez');

    expect(getManagerDisplayName(null)).toBe('Sin asignar');
  });

  it('exposes stable labels for roles and scopes', () => {
    expect(ROLE_LABELS.node_manager).toBe('Gerente de Nodo');
    expect(SCOPE_LABELS.organization).toBe('Toda la organizacion');
  });
});
