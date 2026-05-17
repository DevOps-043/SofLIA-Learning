import { ResponsiveBar } from '@nivo/bar';
import { AlertTriangle } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { PartialTheme } from '@nivo/theming';
import type { BusinessPanelTheme, CourseAnalyticsColors } from './chart-theme';
import type { DropoffAnalysis } from './types';

interface DropoffChartProps {
  colors: CourseAnalyticsColors;
  dropoffAnalysis: DropoffAnalysis;
  nivoTheme: PartialTheme;
  panelTheme: BusinessPanelTheme;
  surfaceStyle: CSSProperties;
}

export function DropoffChart({ colors, dropoffAnalysis, nivoTheme, panelTheme, surfaceStyle }: DropoffChartProps) {
  const data = dropoffAnalysis.dropoff_points.map((item) => ({
    count: item.dropoff_count,
    lesson: item.lesson_title.substring(0, 30) + (item.lesson_title.length > 30 ? '...' : ''),
  }));

  return (
    <div className="rounded-3xl p-6 border" style={surfaceStyle}>
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: panelTheme.textColor }}>
        <AlertTriangle className="w-5 h-5" style={{ color: colors.warning }} />
        Puntos de Abandono
      </h3>
      <div className="h-80">
        {data.length > 0 ? (
          <ResponsiveBar
            data={data}
            keys={['count']}
            indexBy="lesson"
            margin={{ top: 50, right: 50, bottom: 120, left: 60 }}
            padding={0.3}
            valueScale={{ type: 'linear' }}
            indexScale={{ type: 'band', round: true }}
            colors={colors.warning}
            borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
            axisTop={null}
            axisRight={null}
            axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: -45, legend: 'Lección', legendPosition: 'middle', legendOffset: 100 }}
            axisLeft={{ tickSize: 5, tickPadding: 5, tickRotation: 0, legend: 'Usuarios', legendPosition: 'middle', legendOffset: -40 }}
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
            theme={nivoTheme}
          />
        ) : (
          <div className="flex items-center justify-center h-full" style={{ color: panelTheme.subtextColor }}>
            No se identificaron puntos de abandono
          </div>
        )}
      </div>
    </div>
  );
}
