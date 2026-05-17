import { useMemo } from 'react';
import type { PartialTheme } from '@nivo/theming';
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme';

export type BusinessPanelTheme = ReturnType<typeof useBusinessPanelTheme>;

export interface CourseAnalyticsColors {
  accent: string;
  action: string;
  brand: string;
  danger: string;
  success: string;
  warning: string;
}

export function useCourseAnalyticsChartTheme(panelTheme: BusinessPanelTheme) {
  const nivoTheme = useMemo<PartialTheme>(() => ({
    axis: {
      domain: { line: { stroke: panelTheme.dividerColor, strokeWidth: 1 } },
      ticks: {
        line: { stroke: panelTheme.dividerColor, strokeWidth: 1 },
        text: { fill: panelTheme.subtextColor, fontSize: 11 },
      },
    },
    background: 'transparent',
    grid: { line: { stroke: panelTheme.dividerColor, strokeWidth: 1 } },
    text: { fill: panelTheme.subtextColor, fontSize: 12, outlineWidth: 0 },
    tooltip: {
      container: {
        background: panelTheme.panelBg,
        border: `1px solid ${panelTheme.borderColor}`,
        borderRadius: '12px',
        boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
        color: panelTheme.textColor,
        fontSize: 12,
        padding: '8px 12px',
      },
    },
  }), [panelTheme]);

  const colors: CourseAnalyticsColors = {
    accent: panelTheme.accentColor,
    action: panelTheme.actionColor,
    brand: panelTheme.brandColor,
    danger: panelTheme.dangerColor,
    success: panelTheme.successColor,
    warning: panelTheme.warningColor,
  };

  const surfaceStyle = {
    backgroundColor: panelTheme.cardBg,
    borderColor: panelTheme.borderColor,
  };

  return { colors, nivoTheme, surfaceStyle };
}
