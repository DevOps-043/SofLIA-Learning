import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useOrganizationStore } from '@/core/stores/organizationStore';
import type {
  Region,
  Zone,
  Team,
  HierarchyStats,
  HierarchyConfig,
  HierarchyTree,
  UserWithHierarchy,
} from '../types/hierarchy.types';
import { useHierarchyNodes } from './useHierarchyNodes';
import { useHierarchyMembers } from './useHierarchyMembers';

/**
 * Estado del hook de jerarquía
 * Exported so sub-hooks can reference it as a type.
 */
export interface HierarchyState {
  // Datos
  config: HierarchyConfig | null;
  stats: HierarchyStats | null;
  regions: Region[];
  zones: Zone[];
  teams: Team[];
  unassignedUsers: UserWithHierarchy[];
  hierarchyTree: HierarchyTree | null;

  // Estado de carga
  isLoading: boolean;
  isLoadingConfig: boolean;
  isLoadingStats: boolean;
  isLoadingRegions: boolean;
  isLoadingZones: boolean;
  isLoadingTeams: boolean;
  isLoadingUsers: boolean;

  // Errores
  error: string | null;
}

/**
 * Hook para gestionar la jerarquía organizacional.
 * Orchestrates useHierarchyNodes (regions/zones/teams CRUD)
 * and useHierarchyMembers (config, stats, users).
 */
export function useHierarchy() {
  const params = useParams();
  const urlOrgSlug = params?.orgSlug as string | undefined;
  const currentOrgSlug = useOrganizationStore(state => state.currentOrganization?.slug);
  const orgSlug = urlOrgSlug || currentOrgSlug;

  const [state, setState] = useState<HierarchyState>({
    config: null,
    stats: null,
    regions: [],
    zones: [],
    teams: [],
    unassignedUsers: [],
    hierarchyTree: null,
    isLoading: false,
    isLoadingConfig: false,
    isLoadingStats: false,
    isLoadingRegions: false,
    isLoadingZones: false,
    isLoadingTeams: false,
    isLoadingUsers: false,
    error: null
  });

  // ── Helpers (shared with sub-hooks) ───────────────────────────────────────

  const setLoading = useCallback((key: keyof HierarchyState, value: boolean) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => setError(null), [setError]);

  // ── Members sub-hook (stats + config + users) ─────────────────────────────
  // Must be instantiated before nodes because nodes depend on loadStats.

  const {
    loadStats,
    loadConfig,
    updateConfig,
    enableHierarchy,
    disableHierarchy,
    seedDefaultStructure,
    loadUnassignedUsers,
    assignUserToTeam,
    removeUserFromTeam,
  } = useHierarchyMembers({
    orgSlug,
    setState,
    setLoading,
    setError,
    clearError,
    // loadRegions, loadZones, loadTeams are forwarded after nodes are created;
    // seedDefaultStructure calls them via closure through the params below.
    loadRegions: async (options) => nodesRef.loadRegions(options),
    loadZones: async (regionId) => nodesRef.loadZones(regionId),
    loadTeams: async (zoneId) => nodesRef.loadTeams(zoneId),
  });

  // ── Nodes sub-hook (regions + zones + teams) ──────────────────────────────

  const nodes = useHierarchyNodes({
    orgSlug,
    setState,
    setLoading,
    setError,
    clearError,
    loadStats,
  });

  // Stable object ref so the members sub-hook can call node loaders without
  // stale-closure issues (the members hook already captured them via params).
  const nodesRef = nodes;

  const {
    loadRegions,
    loadZones,
    loadTeams,
    loadFullHierarchy,
    createRegion,
    updateRegion,
    deleteRegion,
    createZone,
    updateZone,
    deleteZone,
    createTeam,
    updateTeam,
    deleteTeam,
  } = nodes;

  // ── Combined initial load ─────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    setLoading('isLoading', true);
    try {
      await Promise.all([
        loadConfig(),
        loadStats(),
        loadRegions({ withCounts: true }),
        loadZones(),
        loadTeams(),
        loadUnassignedUsers(),
        loadFullHierarchy()
      ]);
    } finally {
      setLoading('isLoading', false);
    }
  }, [loadConfig, loadStats, loadRegions, loadZones, loadTeams, loadUnassignedUsers, loadFullHierarchy, setLoading]);

  // ── Computed values ───────────────────────────────────────────────────────

  const isHierarchyEnabled = state.config?.hierarchy_enabled ?? false;
  const hasStructure = (state.stats?.teams_count ?? 0) > 0;
  const hasUnassignedUsers = (state.stats?.users_unassigned ?? 0) > 0;
  const canEnableHierarchy = hasStructure && !hasUnassignedUsers;

  // ── Return (same public API as before) ───────────────────────────────────

  return {
    // Estado
    ...state,

    // Computed
    isHierarchyEnabled,
    hasStructure,
    hasUnassignedUsers,
    canEnableHierarchy,

    // Acciones de configuración
    loadConfig,
    updateConfig,
    enableHierarchy,
    disableHierarchy,
    seedDefaultStructure,

    // Acciones de datos
    loadStats,
    loadRegions,
    loadZones,
    loadTeams,
    loadUnassignedUsers,
    loadFullHierarchy,
    loadAll,

    // CRUD Regiones
    createRegion,
    updateRegion,
    deleteRegion,

    // CRUD Zonas
    createZone,
    updateZone,
    deleteZone,

    // CRUD Equipos
    createTeam,
    updateTeam,
    deleteTeam,

    // Usuarios
    assignUserToTeam,
    removeUserFromTeam,

    // Utilidades
    clearError
  };
}

export default useHierarchy;
