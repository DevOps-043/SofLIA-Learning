import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Clock } from 'lucide-react';
import { ChartShell } from './ChartShell';
import { CHART_COLORS, getChartTheme, getTooltipStyle } from './chart-theme';

interface TimeSeriesChartProps {
  data: Array<{ date: string; value: number }>;
  dataKey: string;
  darkMode?: boolean;
  title: string;
}

export function TimeSeriesChart({
  data,
  dataKey,
  darkMode = true,
  title
}: TimeSeriesChartProps) {
  const theme = getChartTheme(darkMode);

  return (
    <ChartShell darkMode={darkMode} icon={Clock} title={title}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
          <XAxis dataKey="date" stroke={theme.axisColor} tick={{ fill: theme.tickColor }} style={{ fontSize: '12px' }} />
          <YAxis stroke={theme.axisColor} tick={{ fill: theme.tickColor }} style={{ fontSize: '12px' }} />
          <Tooltip contentStyle={getTooltipStyle(theme)} />
          <Line
            type="monotone"
            dataKey={dataKey}
            name={title}
            stroke={CHART_COLORS.secondary}
            strokeWidth={3}
            dot={{ fill: CHART_COLORS.secondary, r: 5 }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
