import type {
  HierarchyRole,
  HierarchyScope,
  LocationInfo,
  ManagerInfo,
} from './core.types';

export function hasOrganizationAccess(role: HierarchyRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function isManagerRole(role: HierarchyRole): boolean {
  return role === 'regional_manager' || role === 'zone_manager';
}

export function canAssignUsers(
  role: HierarchyRole,
  scope: HierarchyScope
): boolean {
  if (role === 'owner') return true;
  if (role === 'admin' && scope === 'organization') return true;
  if (role === 'regional_manager') return true;
  if (role === 'zone_manager') return true;
  if (role === 'team_leader') return true;
  return false;
}

export function getDefaultScope(role: HierarchyRole): HierarchyScope {
  switch (role) {
    case 'owner':
    case 'admin':
      return 'organization';
    case 'regional_manager':
      return 'region';
    case 'zone_manager':
      return 'zone';
    case 'team_leader':
    case 'member':
    default:
      return 'team';
  }
}

export const ROLE_LABELS: Record<HierarchyRole, string> = {
  admin: 'Administrador',
  member: 'Miembro',
  node_manager: 'Gerente de Nodo',
  owner: 'Propietario',
  regional_manager: 'Gerente Regional',
  team_leader: 'Lider de Equipo',
  zone_manager: 'Gerente de Zona',
};

export const SCOPE_LABELS: Record<HierarchyScope, string> = {
  organization: 'Toda la organizacion',
  region: 'Region asignada',
  team: 'Equipo asignado',
  zone: 'Zona asignada',
};

export function formatFullAddress(location: LocationInfo): string {
  const parts = [
    location.address,
    location.city,
    location.state,
    location.postal_code,
    location.country,
  ].filter(Boolean);

  return parts.join(', ') || 'Sin direccion';
}

export function getManagerDisplayName(
  manager: ManagerInfo | null | undefined
): string {
  if (!manager) return 'Sin asignar';
  if (manager.display_name) return manager.display_name;
  if (manager.first_name || manager.last_name) {
    return [manager.first_name, manager.last_name].filter(Boolean).join(' ');
  }
  return manager.email;
}
