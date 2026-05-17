import { ResponsivePie } from '@nivo/pie';
import { BarChart3 } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { PartialTheme } from '@nivo/theming';
import type { BusinessPanelTheme, CourseAnalyticsColors } from './chart-theme';
import type { ProgressDistributionItem } from './types';

interface ProgressDistributionChartProps {
  colors: CourseAnalyticsColors;
  items: ProgressDistributionItem[];
  nivoTheme: PartialTheme;
  panelTheme: BusinessPanelTheme;
  surfaceStyle: CSSProperties;
}

export function ProgressDistributionChart({
  colors,
  items,
  nivoTheme,
  panelTheme,
  surfaceStyle,
}: ProgressDistributionChartProps) {
  const data = items.map((item) => ({ id: item.range, label: item.range, value: item.count }));
  const hasData = data.length > 0 && data.some((distribution) => distribution.value > 0);

  return (
    <div className="rounded-3xl p-6 border" style={surfaceStyle}>
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: panelTheme.textColor }}>
        <BarChart3 className="w-5 h-5" style={{ color: colors.action }} />
        Distribución de Progreso
      </h3>
      <div className="h-80">
        {hasData ? (
          <ResponsivePie
            data={data}
            margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
            innerRadius={0.5}
            padAngle={0.7}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            colors={[colors.success, colors.warning, colors.brand, colors.accent, colors.action]}
            borderWidth={1}
            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabelsTextColor={panelTheme.subtextColor}
            arcLinkLabelsThickness={2}
            arcLinkLabelsColor={{ from: 'color' }}
            arcLabelsSkipAngle={10}
            arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
            theme={nivoTheme}
          />
        ) : (
          <div className="flex items-center justify-center h-full" style={{ color: panelTheme.subtextColor }}>
            No hay datos de progreso disponibles
          </div>
        )}
      </div>
    </div>
  );
}
