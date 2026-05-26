'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { ChartBarIcon } from '@heroicons/react/24/outline';

interface CostDataPoint {
  date: string;
  cost: number;
  tokens: number;
  messages: number;
}

interface CostOverviewWidgetProps {
  data: CostDataPoint[];
  isLoading?: boolean;
  chartType?: 'area' | 'bar';
}

type CostChartDataPoint = CostDataPoint & {
  costFormatted: string;
};

interface CostTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{
    payload: CostChartDataPoint;
    value?: number;
  }>;
}

export function CostOverviewWidget({ data, isLoading, chartType = 'area' }: CostOverviewWidgetProps) {
  const chartData = useMemo(() => {
    return data.map((item) => {
      // Parsear la fecha manualmente para evitar problemas de timezone
      // item.date viene como "2025-12-12" (formato YYYY-MM-DD)
      const [year, month, day] = item.date.split('-').map(Number);
      // Crear fecha usando UTC para evitar conversiones de timezone
      const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      
      return {
        ...item,
        date: date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          timeZone: 'UTC' // Forzar interpretación UTC
        }),
        costFormatted: `$${item.cost.toFixed(4)}`,
      };
    });
  }, [data]);

  const totalCost = useMemo(() => {
    return data.reduce((sum, item) => sum + item.cost, 0);
  }, [data]);

  const avgDailyCost = useMemo(() => {
    return data.length > 0 ? totalCost / data.length : 0;
  }, [data, totalCost]);

  const CustomTooltip = ({ active, payload, label }: CostTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 dark:bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-gray-300 text-sm font-medium mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-emerald-400 text-sm">
              <span className="text-gray-400">Costo:</span>{' '}
              <span className="font-semibold">${payload[0]?.value?.toFixed(4)}</span>
            </p>
            {payload[0]?.payload?.tokens && (
              <p className="text-blue-400 text-sm">
                <span className="text-gray-400">Tokens:</span>{' '}
                <span className="font-semibold">
                  {payload[0].payload.tokens.toLocaleString()}
                </span>
              </p>
            )}
            {payload[0]?.payload?.messages && (
              <p className="text-violet-400 text-sm">
                <span className="text-gray-400">Mensajes:</span>{' '}
                <span className="font-semibold">{payload[0].payload.messages}</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-emerald-500" />
            Costos por Período
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Total: <span className="font-semibold text-emerald-500">${totalCost.toFixed(4)}</span>
            {' • '}
            Promedio diario: <span className="font-semibold">${avgDailyCost.toFixed(4)}</span>
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-gray-500 dark:text-gray-400">Costo USD</span>
          </div>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                stroke="var(--color-legacy-9ca3af)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--color-legacy-9ca3af)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toFixed(3)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="cost"
                stroke="var(--color-success)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCost)"
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="date"
                stroke="var(--color-legacy-9ca3af)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--color-legacy-9ca3af)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toFixed(3)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cost" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
