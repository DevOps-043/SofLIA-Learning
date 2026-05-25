import type { CSSProperties } from 'react';
import { DropoffChart } from './DropoffChart';
import { ProgressDistributionChart } from './ProgressDistributionChart';
import type { BusinessPanelTheme, CourseAnalyticsColors } from './chart-theme';
import type { DropoffAnalysis, ProgressDistributionItem } from './types';

interface CourseAnalyticsChartsProps {
  chartTooltipStyle: CSSProperties;
  colors: CourseAnalyticsColors;
  dropoffAnalysis: DropoffAnalysis;
  panelTheme: BusinessPanelTheme;
  progressDistribution: ProgressDistributionItem[];
  surfaceStyle: CSSProperties;
}

export function CourseAnalyticsCharts(props: CourseAnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ProgressDistributionChart
        chartTooltipStyle={props.chartTooltipStyle}
        colors={props.colors}
        items={props.progressDistribution}
        panelTheme={props.panelTheme}
        surfaceStyle={props.surfaceStyle}
      />
      <DropoffChart
        chartTooltipStyle={props.chartTooltipStyle}
        colors={props.colors}
        dropoffAnalysis={props.dropoffAnalysis}
        panelTheme={props.panelTheme}
        surfaceStyle={props.surfaceStyle}
      />
    </div>
  );
}
