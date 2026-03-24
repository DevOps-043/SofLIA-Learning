import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useOrganizationStore } from '@/core/stores/organizationStore';
import { HierarchyService } from '../services/hierarchy.service';
import type {
  Region,
  Zone,
  Team,
  HierarchyStats,
  HierarchyConfig,
  HierarchyTree,
  CreateRegionRequest,
  CreateZoneRequest,
  CreateTeamRequest,
  UpdateRegionRequest,
  UpdateZoneRequest,
  UpdateTeamRequest,
  AssignUserToTeamRequest,
  UserWithHierarchy
} from '../types/hierarchy.types';

/**
 * Estado del hook de jerarquía
 */
interface HierarchyState {
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
 * Hook para gestionar la jerarquía organizacional
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

  // =============================================
  // HELPERS
  // =============================================

  const setLoading = useCallback((key: keyof HierarchyState, value: boolean) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => setError(null), [setError]);

  // =============================================
  // CARGADORES BASE (Declarados primero para evitar errores de hoisting)
  // =============================================

  const loadStats = useCallback(async () => {
    setLoading('isLoadingStats', true);
    try {
      const stats = await HierarchyService.getStats(orgSlug);
      setState(prev => ({ ...prev, stats, isLoadingStats: false }));
      return stats;
    } catch (err) {
      setLoading('isLoadingStats', false);
      return null;
    }
  }, [setLoading, orgSlug]);

  const loadConfig = useCallback(async () => {
    setLoading('isLoadingConfig', true);
    clearError();
    try {
      const config = await HierarchyService.getConfig(orgSlug);
      setState(prev => ({ ...prev, config, isLoadingConfig: false }));
      return config;
    } catch (err) {
      setError('Error al cargar configuración');
      setLoading('isLoadingConfig', false);
      return null;
    }
  }, [setLoading, setError, clearError, orgSlug]);

  const loadRegions = useCallback(async (options?: { includeInactive?: boolean; withCounts?: boolean }) => {
    setLoading('isLoadingRegions', true);
    try {
      const regions = await HierarchyService.getRegions(options, orgSlug);
      setState(prev => ({ ...prev, regions, isLoadingRegions: false }));
      return regions;
    } catch (err) {
      setLoading('isLoadingRegions', false);
      return [];
    }
  }, [setLoading, orgSlug]);

  const loadZones = useCallback(async (regionId?: string) => {
    setLoading('isLoadingZones', true);
    try {
      const zones = await HierarchyService.getZones({ regionId, withCounts: true }, orgSlug);
      setState(prev => ({ ...prev, zones, isLoadingZones: false }));
      return zones;
    } catch (err) {
      setLoading('isLoadingZones', false);
      return [];
    }
  }, [setLoading, orgSlug]);

  const loadTeams = useCallback(async (zoneId?: string) => {
    setLoading('isLoadingTeams', true);
    try {
      const teams = await HierarchyService.getTeams({ zoneId, withCounts: true }, orgSlug);
      setState(prev => ({ ...prev, teams, isLoadingTeams: false }));
      return teams;
    } catch (err) {
      setLoading('isLoadingTeams', false);
      return [];
    }
  }, [setLoading, orgSlug]);

  const loadUnassignedUsers = useCallback(async () => {
    setLoading('isLoadingUsers', true);
    try {
      const users = await HierarchyService.getUnassignedUsers(orgSlug);
      setState(prev => ({ ...prev, unassignedUsers: users, isLoadingUsers: false }));
      return users;
    } catch (err) {
      setLoading('isLoadingUsers', false);
      return [];
    }
  }, [setLoading, orgSlug]);

  const loadFullHierarchy = useCallback(async () => {
    setLoading('isLoading', true);
    try {
      const tree = await HierarchyService.getFullHierarchy(orgSlug);
      setState(prev => ({ ...prev, hierarchyTree: tree, isLoading: false }));
      return tree;
    } catch (err) {
      setLoading('isLoading', false);
      return null;
    }
  }, [setLoading, orgSlug]);

  // =============================================
  // CONFIGURACIÓN (ACCIONES)
  // =============================================

  const updateConfig = useCallback(async (config: Partial<HierarchyConfig>) => {
    setLoading('isLoadingConfig', true);
    clearError();
    try {
      const result = await HierarchyService.updateConfig(config, orgSlug);
      if (result.success && result.data) {
        setState(prev => ({ ...prev, config: result.data!, isLoadingConfig: false }));
        return true;
      }
      setError(result.error || 'Error al actualizar');
      setLoading('isLoadingConfig', false);
      return false;
    } catch (err) {
      setError('Error al actualizar configuración');
      setLoading('isLoadingConfig', false);
      return false;
    }
  }, [setLoading, setError, clearError, orgSlug]);

  const enableHierarchy = useCallback(async () => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.enableHierarchy(orgSlug);
      if (result.success) {
        await loadConfig();
        await loadStats();
        return { success: true };
      }
      setError(result.error || 'Error al activar jerarquía');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al activar jerarquía';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError, loadConfig, loadStats, orgSlug]);

  const disableHierarchy = useCallback(async () => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.disableHierarchy(orgSlug);
      if (result.success) {
        await loadConfig();
        await loadStats();
        return { success: true };
      }
      setError(result.error || 'Error al desactivar jerarquía');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al desactivar jerarquía';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError, loadConfig, loadStats, orgSlug]);

  const seedDefaultStructure = useCallback(async () => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.seedDefaultStructure(orgSlug);
      if (result.success) {
        await Promise.all([loadStats(), loadRegions(), loadZones(), loadTeams()]);
        return { success: true, data: result.data };
      }
      setError(result.error || 'Error al crear estructura');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al crear estructura';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError, loadStats, loadRegions, loadZones, loadTeams, orgSlug]);

  // =============================================
  // REGIONES (CRUD)
  // =============================================

  const createRegion = useCallback(async (data: CreateRegionRequest) => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.createRegion(data, orgSlug);
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          regions: [...prev.regions, result.data!],
          isLoading: false
        }));
        await loadStats();
        return { success: true, data: result.data };
      }
      setError(result.error || 'Error al crear región');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al crear región';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError, loadStats, orgSlug]);

  const updateRegion = useCallback(async (regionId: string, data: UpdateRegionRequest) => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.updateRegion(regionId, data, orgSlug);
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          regions: prev.regions.map(r => r.id === regionId ? result.data! : r),
          isLoading: false
        }));
        return { success: true, data: result.data };
      }
      setError(result.error || 'Error al actualizar región');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al actualizar región';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError, orgSlug]);

  const deleteRegion = useCallback(async (regionId: string) => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.deleteRegion(regionId, orgSlug);
      if (result.success) {
        setState(prev => ({
          ...prev,
          regions: prev.regions.filter(r => r.id !== regionId),
          isLoading: false
        }));
        await loadStats();
        return { success: true };
      }
      setError(result.error || 'Error al eliminar región');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al eliminar región';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError, loadStats, orgSlug]);

  // =============================================
  // ZONAS (CRUD)
  // =============================================

  const createZone = useCallback(async (data: CreateZoneRequest) => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.createZone(data, orgSlug);
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          zones: [...prev.zones, result.data!],
          isLoading: false
        }));
        await loadStats();
        return { success: true, data: result.data };
      }
      setError(result.error || 'Error al crear zona');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al crear zona';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError, loadStats, orgSlug]);

  const updateZone = useCallback(async (zoneId: string, data: UpdateZoneRequest) => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.updateZone(zoneId, data, orgSlug);
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          zones: prev.zones.map(z => z.id === zoneId ? result.data! : z),
          isLoading: false
        }));
        return { success: true, data: result.data };
      }
      setError(result.error || 'Error al actualizar zona');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al actualizar zona';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError, orgSlug]);

  const deleteZone = useCallback(async (zoneId: string) => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.deleteZone(zoneId, orgSlug);
      if (result.success) {
        setState(prev => ({
          ...prev,
          zones: prev.zones.filter(z => z.id !== zoneId),
          isLoading: false
        }));
        await loadStats();
        return { success: true };
      }
      setError(result.error || 'Error al eliminar zona');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al eliminar zona';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError, loadStats, orgSlug]);

  // =============================================
  // EQUIPOS (CRUD)
  // =============================================

  const createTeam = useCallback(async (data: CreateTeamRequest) => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.createTeam(data, orgSlug);
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          teams: [...prev.teams, result.data!],
          isLoading: false
        }));
        await loadStats();
        return { success: true, data: result.data };
      }
      setError(result.error || 'Error al crear equipo');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al crear equipo';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError, loadStats, orgSlug]);

  const updateTeam = useCallback(async (teamId: string, data: UpdateTeamRequest) => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.updateTeam(teamId, data, orgSlug);
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          teams: prev.teams.map(t => t.id === teamId ? result.data! : t),
          isLoading: false
        }));
        return { success: true, data: result.data };
      }
      setError(result.error || 'Error al actualizar equipo');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al actualizar equipo';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError, orgSlug]);

  const deleteTeam = useCallback(async (teamId: string) => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.deleteTeam(teamId, orgSlug);
      if (result.success) {
        setState(prev => ({
          ...prev,
          teams: prev.teams.filter(t => t.id !== teamId),
          isLoading: false
        }));
        await loadStats();
        return { success: true };
      }
      setError(result.error || 'Error al eliminar equipo');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al eliminar equipo';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError, loadStats, orgSlug]);

  // =============================================
  // USUARIOS (ACCIONES)
  // =============================================

  const assignUserToTeam = useCallback(async (data: AssignUserToTeamRequest) => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.assignUserToTeam(data, orgSlug);
      if (result.success) {
        // Refrescar lista de no asignados y estadísticas
        await Promise.all([loadUnassignedUsers(), loadStats(), loadTeams()]);
        return { success: true };
      }
      setError(result.error || 'Error al asignar usuario');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al asignar usuario';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError, loadUnassignedUsers, loadStats, loadTeams, orgSlug]);

  const removeUserFromTeam = useCallback(async (userId: string) => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.removeUserFromTeam(userId, orgSlug);
      if (result.success) {
        await Promise.all([loadUnassignedUsers(), loadStats(), loadTeams()]);
        return { success: true };
      }
      setError(result.error || 'Error al desasignar usuario');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al desasignar usuario';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError, loadUnassignedUsers, loadStats, loadTeams, orgSlug]);

  // =============================================
  // CARGA INICIAL
  // =============================================

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

  // =============================================
  // COMPUTED VALUES
  // =============================================

  const isHierarchyEnabled = state.config?.hierarchy_enabled ?? false;
  const hasStructure = (state.stats?.teams_count ?? 0) > 0;
  const hasUnassignedUsers = (state.stats?.users_unassigned ?? 0) > 0;
  const canEnableHierarchy = hasStructure && !hasUnassignedUsers;

  // =============================================
  // RETURN
  // =============================================

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
