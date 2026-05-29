'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BoltIcon } from '@heroicons/react/24/outline';

interface ModelUsage {
  model: string;
  tokens: number;
  cost: number;
  count: number;
  percentage: number;
}

interface TokenUsageWidgetProps {
  modelUsage: ModelUsage[];
  totalTokens: number;
  isLoading?: boolean;
}

type TokenChartDataPoint = ModelUsage & {
  color: string;
  displayName: string;
};

interface TokenTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: TokenChartDataPoint;
  }>;
}

const MODEL_COLORS: Record<string, string> = {
  'gpt-4o-mini': 'var(--color-success)',
  'gpt-4o': 'var(--color-legacy-6366f1)',
  'gpt-4-turbo': 'var(--color-warning)',
  'gpt-3.5-turbo': 'var(--color-info)',
  default: 'var(--color-secondary)',
};

export function TokenUsageWidget({ modelUsage, totalTokens, isLoading }: TokenUsageWidgetProps) {
  const { t } = useTranslation('admin');
  const chartData = useMemo(() => {
    return modelUsage.map((item) => ({
      ...item,
      displayName: item.model.replace('gpt-', 'GPT-'),
      color: MODEL_COLORS[item.model] || MODEL_COLORS.default,
    }));
  }, [modelUsage]);

  const formatTokens = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const CustomTooltip = ({ active, payload }: TokenTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 dark:bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium mb-2">{data.displayName}</p>
          <div className="space-y-1 text-sm">
            <p className="text-emerald-400">
              <span className="text-gray-400">{t('liaAnalyticsPage.tokenUsage.tooltip.tokens')}:</span>{' '}
              <span className="font-semibold">{data.tokens.toLocaleString()}</span>
            </p>
            <p className="text-blue-400">
              <span className="text-gray-400">{t('liaAnalyticsPage.tokenUsage.tooltip.cost')}:</span>{' '}
              <span className="font-semibold">${data.cost.toFixed(4)}</span>
            </p>
            <p className="text-violet-400">
              <span className="text-gray-400">{t('liaAnalyticsPage.tokenUsage.tooltip.calls')}:</span>{' '}
              <span className="font-semibold">{data.count}</span>
            </p>
            <p className="text-amber-400">
              <span className="text-gray-400">{t('liaAnalyticsPage.tokenUsage.tooltip.percentage')}:</span>{' '}
              <span className="font-semibold">{data.percentage}%</span>
            </p>
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
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BoltIcon className="w-5 h-5 text-amber-500" />
            {t('liaAnalyticsPage.tokenUsage.title')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('liaAnalyticsPage.tokenUsage.total')}: <span className="font-semibold text-amber-500">{formatTokens(totalTokens)}</span> {t('liaAnalyticsPage.units.tokens')}
          </p>
        </div>
      </div>

      {chartData.length > 0 ? (
        <>
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-legacy-374151)" opacity={0.3} horizontal={false} />
                <XAxis
                  type="number"
                  stroke="var(--color-legacy-9ca3af)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatTokens}
                />
                <YAxis
                  type="category"
                  dataKey="displayName"
                  stroke="var(--color-legacy-9ca3af)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="tokens" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend with details */}
          <div className="grid grid-cols-2 gap-3">
            {chartData.map((item) => (
              <div
                key={item.model}
                className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                ></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.displayName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.percentage}% • ${item.cost.toFixed(4)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400">
          {t('liaAnalyticsPage.tokenUsage.empty')}
        </div>
      )}
    </div>
  );
}
