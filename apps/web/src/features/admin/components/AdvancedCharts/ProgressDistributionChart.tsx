import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Users } from 'lucide-react';
import { ChartShell } from './ChartShell';
import { CHART_COLORS, getChartTheme, getTooltipStyle } from './chart-theme';

interface ProgressDistributionChartProps {
  data: Array<{ range: string; count: number }>;
  darkMode?: boolean;
}

export function ProgressDistributionChart({
  data,
  darkMode = true
}: ProgressDistributionChartProps) {
  const theme = getChartTheme(darkMode);
  const average = data.length > 0
    ? data.reduce((sum, item) => sum + item.count, 0) / data.length
    : 0;

  return (
    <ChartShell darkMode={darkMode} icon={Users} title="Distribucion de Progreso">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
          <XAxis dataKey="range" stroke={theme.axisColor} tick={{ fill: theme.tickColor }} style={{ fontSize: '12px' }} />
          <YAxis stroke={theme.axisColor} tick={{ fill: theme.tickColor }} style={{ fontSize: '12px' }} />
          <Tooltip contentStyle={getTooltipStyle(theme)} />
          <Bar dataKey="count" name="Usuarios" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={entry.range} fill={getDistributionColor(index, data.length)} />
            ))}
          </Bar>
          <ReferenceLine
            y={average}
            stroke={CHART_COLORS.info}
            strokeDasharray="5 5"
            label={{ value: 'Promedio', position: 'insideTopRight', fill: CHART_COLORS.info }}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

function getDistributionColor(index: number, length: number) {
  if (index < length / 3) return CHART_COLORS.success;
  if (index < (2 * length) / 3) return CHART_COLORS.warning;
  return CHART_COLORS.danger;
}
