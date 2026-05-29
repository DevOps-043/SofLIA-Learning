'use client';

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

interface ActivitySummary {
  totalActivities: number;
  completedActivities: number;
  abandonedActivities: number;
  inProgressActivities: number;
  completionRate: number;
  abandonRate: number;
  avgCompletionTimeSeconds: number;
  avgRedirections: number;
}

interface StatusData {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

interface ActivityPerformanceWidgetProps {
  period?: string;
  isLoading?: boolean;
}

export function ActivityPerformanceWidget({ period = 'month', isLoading: externalLoading }: ActivityPerformanceWidgetProps) {
  const { t } = useTranslation('admin');
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/lia-analytics/activities?period=${period}`);
        const data = await response.json();

        if (data.success) {
          setSummary(data.data.summary);
          setStatusData(data.data.byStatus);
        }
      } catch (error) {
        techDebtLogger.error('Error fetching activities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [period]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  if (isLoading || externalLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BoltIcon className="w-5 h-5 text-amber-500" />
          {t('liaAnalyticsPage.activityPerformance.title')}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          {t('liaAnalyticsPage.activityPerformance.empty')}
        </p>
      </div>
    );
  }

  const metrics = [
    {
      label: t('liaAnalyticsPage.activityPerformance.metrics.completionRate'),
      value: `${summary.completionRate}%`,
      icon: CheckCircleIcon,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      trend: summary.completionRate >= 70 ? 'good' : summary.completionRate >= 50 ? 'neutral' : 'bad',
    },
    {
      label: t('liaAnalyticsPage.activityPerformance.metrics.abandonRate'),
      value: `${summary.abandonRate}%`,
      icon: XCircleIcon,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-500/10',
      trend: summary.abandonRate <= 20 ? 'good' : summary.abandonRate <= 40 ? 'neutral' : 'bad',
    },
    {
      label: t('liaAnalyticsPage.activityPerformance.metrics.averageTime'),
      value: formatTime(summary.avgCompletionTimeSeconds),
      icon: ClockIcon,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: t('liaAnalyticsPage.activityPerformance.metrics.averageRedirections'),
      value: summary.avgRedirections.toFixed(1),
      icon: ArrowPathIcon,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      trend: summary.avgRedirections <= 1 ? 'good' : summary.avgRedirections <= 3 ? 'neutral' : 'bad',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BoltIcon className="w-5 h-5 text-amber-500" />
            {t('liaAnalyticsPage.activityPerformance.title')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('liaAnalyticsPage.activityPerformance.total', { count: summary.totalActivities })}
          </p>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={`p-4 rounded-xl ${metric.bgColor} border border-transparent`}
          >
            <div className="flex items-center gap-2 mb-2">
              <metric.icon className={`w-5 h-5 ${metric.iconColor}`} />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {metric.label}
              </span>
            </div>
            <p className={`text-2xl font-bold ${metric.iconColor}`}>
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* Barra de distribución */}
      {statusData.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {t('liaAnalyticsPage.activityPerformance.statusDistribution')}
          </p>
          <div className="flex h-4 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
            {statusData.map((status) => (
              <div
                key={status.status}
                className="h-full transition-all duration-300"
                style={{
                  width: `${status.percentage}%`,
                  backgroundColor: status.color,
                }}
                title={`${t(`liaAnalyticsPage.activityPerformance.status.${status.status}`, { defaultValue: status.status })}: ${status.count} (${status.percentage}%)`}
              ></div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {statusData.map((status) => (
              <div key={status.status} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: status.color }}
                ></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t(`liaAnalyticsPage.activityPerformance.status.${status.status}`, { defaultValue: status.status })}: {status.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
