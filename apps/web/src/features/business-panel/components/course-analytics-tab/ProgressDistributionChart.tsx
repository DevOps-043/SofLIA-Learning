import { BarChart3 } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { BusinessPanelTheme, CourseAnalyticsColors } from './chart-theme';
import type { ProgressDistributionItem } from './types';

interface ProgressDistributionChartProps {
  chartTooltipStyle: CSSProperties;
  colors: CourseAnalyticsColors;
  items: ProgressDistributionItem[];
  panelTheme: BusinessPanelTheme;
  surfaceStyle: CSSProperties;
}

export function ProgressDistributionChart({
  chartTooltipStyle,
  colors,
  items,
  panelTheme,
  surfaceStyle,
}: ProgressDistributionChartProps) {
  const palette = [colors.success, colors.warning, colors.brand, colors.accent, colors.action];
  const data = items.map((item, index) => ({
    fill: palette[index % palette.length],
    name: item.range,
    value: item.count,
  }));
  const hasData = data.length > 0 && data.some((distribution) => distribution.value > 0);

  return (
    <div className="rounded-3xl p-6 border" style={surfaceStyle}>
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: panelTheme.textColor }}>
        <BarChart3 className="w-5 h-5" style={{ color: colors.action }} />
        Distribución de Progreso
      </h3>
      <div className="h-80">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 24, right: 24, bottom: 24, left: 24 }}>
              <Pie
                cx="50%"
                cy="50%"
                data={data}
                dataKey="value"
                innerRadius="50%"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
                nameKey="name"
                outerRadius="80%"
                paddingAngle={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} stroke={panelTheme.cardBg} strokeWidth={1} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(value) => [value, 'Usuarios']}
                labelStyle={{ color: panelTheme.textColor }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full" style={{ color: panelTheme.subtextColor }}>
            No hay datos de progreso disponibles
          </div>
        )}
      </div>
    </div>
  );
}
