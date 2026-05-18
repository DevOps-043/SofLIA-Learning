import { AlertTriangle } from 'lucide-react';
import type { CSSProperties } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BusinessPanelTheme, CourseAnalyticsColors } from './chart-theme';
import type { DropoffAnalysis } from './types';

interface DropoffChartProps {
  chartTooltipStyle: CSSProperties;
  colors: CourseAnalyticsColors;
  dropoffAnalysis: DropoffAnalysis;
  panelTheme: BusinessPanelTheme;
  surfaceStyle: CSSProperties;
}

export function DropoffChart({
  chartTooltipStyle,
  colors,
  dropoffAnalysis,
  panelTheme,
  surfaceStyle,
}: DropoffChartProps) {
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
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 24, right: 24, bottom: 72, left: 8 }}>
              <CartesianGrid stroke={panelTheme.dividerColor} strokeDasharray="3 3" vertical={false} />
              <XAxis
                angle={-45}
                dataKey="lesson"
                height={88}
                interval={0}
                textAnchor="end"
                tick={{ fill: panelTheme.subtextColor, fontSize: 11 }}
                tickLine={{ stroke: panelTheme.dividerColor }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: panelTheme.subtextColor, fontSize: 11 }}
                tickLine={{ stroke: panelTheme.dividerColor }}
                width={44}
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
                cursor={{ fill: panelTheme.hoverBg }}
                formatter={(value) => [value, 'Usuarios']}
                labelStyle={{ color: panelTheme.textColor }}
              />
              <Bar dataKey="count" fill={colors.warning} name="Usuarios" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full" style={{ color: panelTheme.subtextColor }}>
            No se identificaron puntos de abandono
          </div>
        )}
      </div>
    </div>
  );
}
