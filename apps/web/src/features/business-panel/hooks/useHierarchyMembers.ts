/**
 * useHierarchyMembers
 *
 * Sub-hook extracted from useHierarchy.
 * Owns loaders and operations for hierarchy members (users),
 * plus config management and the seedDefaultStructure helper.
 */

import { useCallback } from 'react';
import { HierarchyService } from '../services/hierarchy.service';
import type {
  HierarchyConfig,
  HierarchyStats,
  AssignUserToTeamRequest,
  UserWithHierarchy,
} from '../types/hierarchy.types';
import type { HierarchyState } from './useHierarchy';

interface UseHierarchyMembersParams {
  orgSlug: string | undefined;
  setState: React.Dispatch<React.SetStateAction<HierarchyState>>;
  setLoading: (key: keyof HierarchyState, value: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  loadRegions: (options?: { includeInactive?: boolean; withCounts?: boolean }) => Promise<unknown[]>;
  loadZones: (regionId?: string) => Promise<unknown[]>;
  loadTeams: (zoneId?: string) => Promise<unknown[]>;
}

export function useHierarchyMembers({
  orgSlug,
  setState,
  setLoading,
  setError,
  clearError,
  loadRegions,
  loadZones,
  loadTeams,
}: UseHierarchyMembersParams) {

  // ── Stats ─────────────────────────────────────────────────────────────────

  const loadStats = useCallback(async () => {
    setLoading('isLoadingStats', true);
    try {
      const stats = await HierarchyService.getStats(orgSlug);
      setState(prev => ({ ...prev, stats, isLoadingStats: false }));
      return stats as HierarchyStats;
    } catch (err) {
      setLoading('isLoadingStats', false);
      return null;
    }
  }, [setLoading, setState, orgSlug]);

  // ── Config ────────────────────────────────────────────────────────────────

  const loadConfig = useCallback(async () => {
    setLoading('isLoadingConfig', true);
    clearError();
    try {
      const config = await HierarchyService.getConfig(orgSlug);
      setState(prev => ({ ...prev, config, isLoadingConfig: false }));
      return config as HierarchyConfig;
    } catch (err) {
      setError('Error al cargar configuración');
      setLoading('isLoadingConfig', false);
      return null;
    }
  }, [setLoading, setError, clearError, setState, orgSlug]);

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
  }, [setLoading, setError, clearError, setState, orgSlug]);

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

  // ── Users ─────────────────────────────────────────────────────────────────

  const loadUnassignedUsers = useCallback(async () => {
    setLoading('isLoadingUsers', true);
    try {
      const users = await HierarchyService.getUnassignedUsers(orgSlug);
      setState(prev => ({ ...prev, unassignedUsers: users, isLoadingUsers: false }));
      return users as UserWithHierarchy[];
    } catch (err) {
      setLoading('isLoadingUsers', false);
      return [] as UserWithHierarchy[];
    }
  }, [setLoading, setState, orgSlug]);

  const assignUserToTeam = useCallback(async (data: AssignUserToTeamRequest) => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.assignUserToTeam(data, orgSlug);
      if (result.success) {
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

  return {
    // Stats
    loadStats,
    // Config
    loadConfig,
    updateConfig,
    enableHierarchy,
    disableHierarchy,
    seedDefaultStructure,
    // Users
    loadUnassignedUsers,
    assignUserToTeam,
    removeUserFromTeam,
  };
}
