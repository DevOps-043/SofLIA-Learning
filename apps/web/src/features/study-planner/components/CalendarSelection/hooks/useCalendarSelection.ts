'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { CalendarListItem, CalendarProvider } from '../../../types/user-context.types';

interface UseCalendarSelectionReturn {
  calendars: CalendarListItem[];
  selectedIds: Set<string>;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  hasChanges: boolean;
  staleWarning: boolean;
  fetchCalendars: () => Promise<void>;
  toggleCalendar: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  saveSelection: () => Promise<boolean>;
}

export function useCalendarSelection(provider: CalendarProvider): UseCalendarSelectionReturn {
  const [calendars, setCalendars] = useState<CalendarListItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staleWarning, setStaleWarning] = useState(false);

  // Referencia a los IDs originales del servidor para detectar cambios
  const originalIdsRef = useRef<Set<string>>(new Set());

  const hasChanges = (() => {
    if (originalIdsRef.current.size !== selectedIds.size) return true;
    for (const id of selectedIds) {
      if (!originalIdsRef.current.has(id)) return true;
    }
    return false;
  })();

  const fetchCalendars = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setStaleWarning(false);

    try {
      const response = await fetch(`/api/study-planner/calendar/list?provider=${provider}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al cargar los calendarios');
        return;
      }

      if (data.success && data.data) {
        setCalendars(data.data.calendars);
        const serverIds = new Set<string>(data.data.selectedIds);
        setSelectedIds(serverIds);
        originalIdsRef.current = new Set(serverIds);

        // Detectar si hubo limpieza de IDs stale en el servidor
        if (data.data.staleIdsRemoved) {
          setStaleWarning(true);
        }
      }
    } catch (err) {
      setError('Error al cargar los calendarios');
      console.error('[useCalendarSelection] Error fetching calendars:', err);
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

  const toggleCalendar = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        // No permitir deseleccionar si solo queda 1
        if (next.size <= 1) return prev;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setError(null);
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(calendars.map(c => c.id)));
    setError(null);
  }, [calendars]);

  const deselectAll = useCallback(() => {
    // No permitir deseleccionar todos, mantener al menos el primero
    if (calendars.length > 0) {
      const primary = calendars.find(c => c.isConnectedAccountPrimary) || calendars.find(c => c.isPrimary);
      setSelectedIds(new Set([primary?.id || calendars[0].id]));
    }
    setError(null);
  }, [calendars]);

  const saveSelection = useCallback(async (): Promise<boolean> => {
    if (selectedIds.size === 0) {
      setError('Debes seleccionar al menos un calendario');
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/study-planner/calendar/selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedCalendarIds: Array.from(selectedIds),
          provider,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al guardar la selección');
        return false;
      }

      // Actualizar referencia original
      originalIdsRef.current = new Set(selectedIds);
      return true;
    } catch (err) {
      setError('Error al guardar la selección');
      console.error('[useCalendarSelection] Error saving selection:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [provider, selectedIds]);

  return {
    calendars,
    selectedIds,
    isLoading,
    isSaving,
    error,
    hasChanges,
    staleWarning,
    fetchCalendars,
    toggleCalendar,
    selectAll,
    deselectAll,
    saveSelection,
  };
}
