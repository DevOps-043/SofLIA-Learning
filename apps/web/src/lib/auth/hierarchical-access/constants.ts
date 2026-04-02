import type { HierarchyRole, HierarchyScope } from './types'

export const ROLE_HIERARCHY: Record<HierarchyRole, number> = {
  owner: 100,
  admin: 80,
  regional_manager: 60,
  zone_manager: 40,
  team_leader: 20,
  member: 10,
}

export const ROLE_LABELS: Record<HierarchyRole, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  regional_manager: 'Gerente Regional',
  zone_manager: 'Gerente de Zona',
  team_leader: 'Líder de Equipo',
  member: 'Miembro',
}

export const SCOPE_LABELS: Record<HierarchyScope, string> = {
  organization: 'Toda la organización',
  region: 'Región asignada',
  zone: 'Zona asignada',
  team: 'Equipo asignado',
}

export const ROLE_DESCRIPTIONS: Record<HierarchyRole, string> = {
  owner: 'Control total sobre la organización sin restricciones',
  admin: 'Administrador con acceso según asignación',
  regional_manager: 'Gestiona todos los equipos de una región',
  zone_manager: 'Gestiona todos los equipos de una zona',
  team_leader: 'Lidera y gestiona un equipo específico',
  member: 'Miembro con acceso a su equipo',
}
