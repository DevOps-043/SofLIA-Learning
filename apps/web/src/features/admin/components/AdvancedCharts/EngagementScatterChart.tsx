import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Activity } from 'lucide-react';
import { ChartShell } from './ChartShell';
import { CHART_COLORS, getChartTheme, getTooltipStyle } from './chart-theme';

interface EngagementScatterChartProps {
  data: Array<{ progress: number; days_active: number; notes_created: number; user_id: string }>;
  darkMode?: boolean;
}

export function EngagementScatterChart({
  data,
  darkMode = true
}: EngagementScatterChartProps) {
  const theme = getChartTheme(darkMode);

  return (
    <ChartShell darkMode={darkMode} icon={Activity} title="Correlacion: Progreso vs Dias Activos">
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
          <XAxis
            type="number"
            dataKey="progress"
            name="Progreso (%)"
            stroke={theme.axisColor}
            tick={{ fill: theme.tickColor }}
            style={{ fontSize: '12px' }}
            domain={[0, 100]}
          />
          <YAxis
            type="number"
            dataKey="days_active"
            name="Dias Activos"
            stroke={theme.axisColor}
            tick={{ fill: theme.tickColor }}
            style={{ fontSize: '12px' }}
          />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={getTooltipStyle(theme)} />
          <Scatter name="Usuarios" data={data} fill={CHART_COLORS.primary} />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
