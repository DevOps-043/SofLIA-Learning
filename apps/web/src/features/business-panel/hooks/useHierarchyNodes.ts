/**
 * useHierarchyNodes
 *
 * Sub-hook extracted from useHierarchy.
 * Owns loaders and CRUD operations for hierarchy nodes:
 * regions, zones, teams, and the full-hierarchy tree.
 */

import { useCallback } from 'react';
import { HierarchyService } from '../services/hierarchy.service';
import type {
  Region,
  Zone,
  Team,
  HierarchyTree,
  CreateRegionRequest,
  CreateZoneRequest,
  CreateTeamRequest,
  UpdateRegionRequest,
  UpdateZoneRequest,
  UpdateTeamRequest,
} from '../types/hierarchy.types';
import type { HierarchyState } from './useHierarchy';

interface UseHierarchyNodesParams {
  orgSlug: string | undefined;
  setState: React.Dispatch<React.SetStateAction<HierarchyState>>;
  setLoading: (key: keyof HierarchyState, value: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  loadStats: () => Promise<unknown>;
}

export function useHierarchyNodes({
  orgSlug,
  setState,
  setLoading,
  setError,
  clearError,
  loadStats,
}: UseHierarchyNodesParams) {

  // ── Loaders ───────────────────────────────────────────────────────────────

  const loadRegions = useCallback(async (options?: { includeInactive?: boolean; withCounts?: boolean }) => {
    setLoading('isLoadingRegions', true);
    try {
      const regions = await HierarchyService.getRegions(options, orgSlug);
      setState(prev => ({ ...prev, regions, isLoadingRegions: false }));
      return regions;
    } catch (err) {
      setLoading('isLoadingRegions', false);
      return [] as Region[];
    }
  }, [setLoading, setState, orgSlug]);

  const loadZones = useCallback(async (regionId?: string) => {
    setLoading('isLoadingZones', true);
    try {
      const zones = await HierarchyService.getZones({ regionId, withCounts: true }, orgSlug);
      setState(prev => ({ ...prev, zones, isLoadingZones: false }));
      return zones;
    } catch (err) {
      setLoading('isLoadingZones', false);
      return [] as Zone[];
    }
  }, [setLoading, setState, orgSlug]);

  const loadTeams = useCallback(async (zoneId?: string) => {
    setLoading('isLoadingTeams', true);
    try {
      const teams = await HierarchyService.getTeams({ zoneId, withCounts: true }, orgSlug);
      setState(prev => ({ ...prev, teams, isLoadingTeams: false }));
      return teams;
    } catch (err) {
      setLoading('isLoadingTeams', false);
      return [] as Team[];
    }
  }, [setLoading, setState, orgSlug]);

  const loadFullHierarchy = useCallback(async () => {
    setLoading('isLoading', true);
    try {
      const tree = await HierarchyService.getFullHierarchy(orgSlug);
      setState(prev => ({ ...prev, hierarchyTree: tree, isLoading: false }));
      return tree;
    } catch (err) {
      setLoading('isLoading', false);
      return null as HierarchyTree | null;
    }
  }, [setLoading, setState, orgSlug]);

  // ── Regions CRUD ──────────────────────────────────────────────────────────

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
  }, [setLoading, clearError, setError, setState, loadStats, orgSlug]);

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
  }, [setLoading, clearError, setError, setState, orgSlug]);

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
  }, [setLoading, clearError, setError, setState, loadStats, orgSlug]);

  // ── Zones CRUD ────────────────────────────────────────────────────────────

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
  }, [setLoading, clearError, setError, setState, loadStats, orgSlug]);

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
  }, [setLoading, clearError, setError, setState, orgSlug]);

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
  }, [setLoading, clearError, setError, setState, loadStats, orgSlug]);

  // ── Teams CRUD ────────────────────────────────────────────────────────────

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
  }, [setLoading, clearError, setError, setState, loadStats, orgSlug]);

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
  }, [setLoading, clearError, setError, setState, orgSlug]);

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
  }, [setLoading, clearError, setError, setState, loadStats, orgSlug]);

  return {
    // Loaders
    loadRegions,
    loadZones,
    loadTeams,
    loadFullHierarchy,
    // Regions
    createRegion,
    updateRegion,
    deleteRegion,
    // Zones
    createZone,
    updateZone,
    deleteZone,
    // Teams
    createTeam,
    updateTeam,
    deleteTeam,
  };
}
