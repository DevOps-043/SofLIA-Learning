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
import { TrendingUp } from 'lucide-react';
import { ChartShell } from './ChartShell';
import { CHART_COLORS, getChartTheme, getTooltipStyle } from './chart-theme';

interface EnrollmentTrendChartProps {
  data: Array<{ date: string; enrollments: number; completions: number }>;
  darkMode?: boolean;
}

export function EnrollmentTrendChart({
  data,
  darkMode = true
}: EnrollmentTrendChartProps) {
  const theme = getChartTheme(darkMode);

  return (
    <ChartShell darkMode={darkMode} icon={TrendingUp} title="Tendencia de Inscripciones">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
          <XAxis dataKey="date" stroke={theme.axisColor} tick={{ fill: theme.tickColor }} style={{ fontSize: '12px' }} />
          <YAxis stroke={theme.axisColor} tick={{ fill: theme.tickColor }} style={{ fontSize: '12px' }} />
          <Tooltip contentStyle={getTooltipStyle(theme)} />
          <Legend wrapperStyle={{ color: theme.tickColor }} />
          <Line
            type="monotone"
            dataKey="enrollments"
            name="Inscripciones"
            stroke={CHART_COLORS.primary}
            strokeWidth={2}
            dot={{ fill: CHART_COLORS.primary, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="completions"
            name="Completados"
            stroke={CHART_COLORS.success}
            strokeWidth={2}
            dot={{ fill: CHART_COLORS.success, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
