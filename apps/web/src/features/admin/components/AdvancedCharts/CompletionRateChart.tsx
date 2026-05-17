import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Award } from 'lucide-react';
import { ChartShell } from './ChartShell';
import { CHART_COLORS, getChartTheme, getTooltipStyle } from './chart-theme';

interface CompletionRateChartProps {
  data: Array<{ period: string; enrollment_rate: number; completion_rate: number; retention_rate: number }>;
  darkMode?: boolean;
}

export function CompletionRateChart({
  data,
  darkMode = true
}: CompletionRateChartProps) {
  const theme = getChartTheme(darkMode);

  return (
    <ChartShell darkMode={darkMode} icon={Award} title="Tasas de RRHH: Inscripcion, Finalizacion y Retencion">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
          <XAxis dataKey="period" stroke={theme.axisColor} tick={{ fill: theme.tickColor }} style={{ fontSize: '12px' }} />
          <YAxis stroke={theme.axisColor} tick={{ fill: theme.tickColor }} domain={[0, 100]} style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={getTooltipStyle(theme)}
            formatter={(value: number) => `${value.toFixed(1)}%`}
          />
          <Legend wrapperStyle={{ color: theme.tickColor }} />
          <Line type="monotone" dataKey="enrollment_rate" name="Tasa de Inscripcion" stroke={CHART_COLORS.primary} strokeWidth={2} dot={{ fill: CHART_COLORS.primary, r: 4 }} />
          <Line type="monotone" dataKey="completion_rate" name="Tasa de Finalizacion" stroke={CHART_COLORS.success} strokeWidth={2} dot={{ fill: CHART_COLORS.success, r: 4 }} />
          <Line type="monotone" dataKey="retention_rate" name="Tasa de Retencion" stroke={CHART_COLORS.info} strokeWidth={2} dot={{ fill: CHART_COLORS.info, r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
