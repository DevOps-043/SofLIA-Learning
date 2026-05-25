'use client';

import type React from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardEditHint } from './dashboard-layout-manager/DashboardEditHint';
import { DashboardGridRenderer } from './dashboard-layout-manager/DashboardGridRenderer';
import { DashboardLayoutToolbar } from './dashboard-layout-manager/DashboardLayoutToolbar';
import { DashboardResetConfirm } from './dashboard-layout-manager/DashboardResetConfirm';
import type { WidgetConfig } from './dashboard-layout-manager/types';
import { useDashboardLayoutManager } from './dashboard-layout-manager/useDashboardLayoutManager';

interface DashboardLayoutManagerProps {
  children: React.ReactNode;
  widgets: WidgetConfig[];
  onLayoutChange?: (widgets: WidgetConfig[]) => void;
}

export function DashboardLayoutManager({
  children,
  widgets,
  onLayoutChange
}: DashboardLayoutManagerProps) {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation('common');
  const layoutState = useDashboardLayoutManager({ children, onLayoutChange, widgets });

  return (
    <div className="relative">
      {layoutState.pendingReset && (
        <DashboardResetConfirm
          onCancel={() => layoutState.setPendingReset(false)}
          onConfirm={layoutState.handleConfirmReset}
          t={t}
          tc={tc}
        />
      )}
      <DashboardLayoutToolbar
        isEditMode={layoutState.isEditMode}
        isSaving={layoutState.isSaving}
        onCancelEdit={() => layoutState.setIsEditMode(false)}
        onEdit={() => layoutState.setIsEditMode(true)}
        onReset={() => layoutState.setPendingReset(true)}
        onSave={layoutState.handleSave}
        t={t}
        tc={tc}
      />
      <DashboardGridRenderer
        childrenMap={layoutState.childrenMap}
        currentLayout={layoutState.currentLayout}
        isEditMode={layoutState.isEditMode}
        onLayoutChange={layoutState.handleLayoutChange}
        widgets={widgets}
      />
      {layoutState.isEditMode && <DashboardEditHint />}
    </div>
  );
}
