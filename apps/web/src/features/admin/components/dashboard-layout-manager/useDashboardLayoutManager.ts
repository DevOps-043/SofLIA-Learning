import { logger as techDebtLogger } from '@/lib/utils/logger'
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createChildrenMap, mergeLayoutIntoWidgets, widgetsToLayout } from './layout-mappers';
import type { GridLayoutItem, GridLayouts, WidgetConfig } from './types';

interface UseDashboardLayoutManagerParams {
  children: React.ReactNode;
  onLayoutChange?: (widgets: WidgetConfig[]) => void;
  widgets: WidgetConfig[];
}

export function useDashboardLayoutManager({
  children,
  onLayoutChange,
  widgets
}: UseDashboardLayoutManagerParams) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<GridLayoutItem[]>([]);
  const [pendingReset, setPendingReset] = useState(false);
  const childrenMap = useMemo(() => createChildrenMap(children), [children]);

  useEffect(() => {
    setCurrentLayout(widgets.length > 0 ? widgetsToLayout(widgets) : []);
  }, [widgets]);

  const handleLayoutChange = useCallback((newLayout: GridLayoutItem[], allLayouts: GridLayouts) => {
    if (!onLayoutChange) return;
    const updatedWidgets = mergeLayoutIntoWidgets(newLayout, allLayouts, widgets);
    if (updatedWidgets.length > 0) onLayoutChange(updatedWidgets);
  }, [widgets, onLayoutChange]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/dashboard/layout', {
        body: JSON.stringify({
          is_default: true,
          layout_config: { widgets },
          name: 'Mi Dashboard Personalizado'
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) setIsEditMode(false);
    } catch (error) {
      techDebtLogger.error('Error saving layout:', error);
    } finally {
      setIsSaving(false);
    }
  }, [widgets]);

  const handleConfirmReset = useCallback(async () => {
    setPendingReset(false);
    try {
      await fetch('/api/admin/dashboard/layout', { method: 'DELETE' });
      window.location.reload();
    } catch (error) {
      techDebtLogger.error('Error resetting layout:', error);
    }
  }, []);

  return {
    childrenMap,
    currentLayout,
    handleConfirmReset,
    handleLayoutChange,
    handleSave,
    isEditMode,
    isSaving,
    pendingReset,
    setIsEditMode,
    setPendingReset
  };
}
