import type { CSSProperties } from 'react';
import type { PartialTheme } from '@nivo/theming';
import { DropoffChart } from './DropoffChart';
import { ProgressDistributionChart } from './ProgressDistributionChart';
import type { BusinessPanelTheme, CourseAnalyticsColors } from './chart-theme';
import type { DropoffAnalysis, ProgressDistributionItem } from './types';

interface CourseAnalyticsChartsProps {
  colors: CourseAnalyticsColors;
  dropoffAnalysis: DropoffAnalysis;
  nivoTheme: PartialTheme;
  panelTheme: BusinessPanelTheme;
  progressDistribution: ProgressDistributionItem[];
  surfaceStyle: CSSProperties;
}

export function CourseAnalyticsCharts(props: CourseAnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ProgressDistributionChart
        colors={props.colors}
        items={props.progressDistribution}
        nivoTheme={props.nivoTheme}
        panelTheme={props.panelTheme}
        surfaceStyle={props.surfaceStyle}
      />
      <DropoffChart
        colors={props.colors}
        dropoffAnalysis={props.dropoffAnalysis}
        nivoTheme={props.nivoTheme}
        panelTheme={props.panelTheme}
        surfaceStyle={props.surfaceStyle}
      />
    </div>
  );
}
