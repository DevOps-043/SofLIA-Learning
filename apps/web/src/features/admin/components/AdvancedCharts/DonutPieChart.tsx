import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { ChartShell } from './ChartShell';
import { CHART_COLORS, getChartTheme, getTooltipStyle } from './chart-theme';

interface DonutPieChartProps {
  data: Array<{ name: string; count: number }>;
  darkMode?: boolean;
  title: string;
}

const PIE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.info,
  CHART_COLORS.danger
];

export function DonutPieChart({ data, title, darkMode = true }: DonutPieChartProps) {
  const theme = getChartTheme(darkMode);
  const total = data.reduce((sum, item) => sum + (item.count || 0), 0);

  return (
    <ChartShell darkMode={darkMode} title={title} totalLabel={`${total} usuarios`}>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Tooltip
            contentStyle={getTooltipStyle(theme)}
            formatter={(value: number, name: string) => [`${value}`, name]}
          />
          <Legend wrapperStyle={{ color: theme.tickColor }} />
          <Pie
            data={data}
            dataKey="count"
            nameKey="name"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
