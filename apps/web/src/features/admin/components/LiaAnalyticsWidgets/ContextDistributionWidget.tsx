'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartPieIcon } from '@heroicons/react/24/outline';

interface ContextData {
  contextType: string;
  count: number;
  cost: number;
  tokens: number;
  percentage: number;
}

interface ContextDistributionWidgetProps {
  data: ContextData[];
  isLoading?: boolean;
}

interface ChartContextData extends ContextData {
  name: string;
  color: string;
}

interface ContextTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartContextData;
  }>;
}

interface ContextLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}

const CONTEXT_COLORS: Record<string, string> = {
  course: '#8b5cf6',
  general: '#6366f1',
  workshop: '#14b8a6',
  prompts: '#f97316',
  community: '#ec4899',
  news: '#3b82f6',
  default: '#9ca3af',
};

const CONTEXT_LABELS: Record<string, string> = {
  course: 'Cursos',
  general: 'General',
  workshop: 'Talleres',
  prompts: 'Prompts',
  community: 'Comunidades',
  news: 'Noticias',
};

export function ContextDistributionWidget({ data, isLoading }: ContextDistributionWidgetProps) {
  const chartData = useMemo<ChartContextData[]>(() => {
    return data.map((item) => ({
      ...item,
      name: CONTEXT_LABELS[item.contextType] || item.contextType,
      color: CONTEXT_COLORS[item.contextType] || CONTEXT_COLORS.default,
    }));
  }, [data]);

  const totalConversations = useMemo(() => {
    return data.reduce((sum, item) => sum + item.count, 0);
  }, [data]);

  const totalCost = useMemo(() => {
    return data.reduce((sum, item) => sum + item.cost, 0);
  }, [data]);

  const CustomTooltip = ({ active, payload }: ContextTooltipProps) => {
    const tooltipData = payload?.[0]?.payload;
    if (active && tooltipData) {
      return (
        <div className="bg-gray-900 dark:bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: tooltipData.color }}
            />
            <p className="text-white font-medium">{tooltipData.name}</p>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-violet-400">
              <span className="text-gray-400">Conversaciones:</span>{' '}
              <span className="font-semibold">{tooltipData.count}</span>
            </p>
            <p className="text-emerald-400">
              <span className="text-gray-400">Costo:</span>{' '}
              <span className="font-semibold">${tooltipData.cost.toFixed(4)}</span>
            </p>
            <p className="text-amber-400">
              <span className="text-gray-400">Tokens:</span>{' '}
              <span className="font-semibold">{tooltipData.tokens.toLocaleString()}</span>
            </p>
            <p className="text-blue-400">
              <span className="text-gray-400">Porcentaje:</span>{' '}
              <span className="font-semibold">{tooltipData.percentage}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: ContextLabelProps) => {
    const safePercent = percent ?? 0;
    if (safePercent < 0.05) return null;

    const RADIAN = Math.PI / 180;
    const safeCx = cx ?? 0;
    const safeCy = cy ?? 0;
    const safeMidAngle = midAngle ?? 0;
    const safeInnerRadius = innerRadius ?? 0;
    const safeOuterRadius = outerRadius ?? 0;
    const radius = safeInnerRadius + (safeOuterRadius - safeInnerRadius) * 0.5;
    const x = safeCx + radius * Math.cos(-safeMidAngle * RADIAN);
    const y = safeCy + radius * Math.sin(-safeMidAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(safePercent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto w-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ChartPieIcon className="w-5 h-5 text-violet-500" />
            Distribucion por Contexto
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {totalConversations} conversaciones - ${totalCost.toFixed(4)} total
          </p>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="h-56 w-full lg:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="count"
                  labelLine={false}
                  label={renderCustomLabel}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full lg:w-1/2 space-y-2">
            {chartData.map((item) => (
              <div
                key={item.contextType}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>{item.count} conv.</span>
                  <span className="text-emerald-500 font-medium">
                    ${item.cost.toFixed(4)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-56 flex items-center justify-center text-gray-500 dark:text-gray-400">
          No hay datos de distribucion
        </div>
      )}
    </div>
  );
}
