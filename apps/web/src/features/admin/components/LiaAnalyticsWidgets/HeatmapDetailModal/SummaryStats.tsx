import {
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import type { HourDetailData } from './types';

interface SummaryStatsProps {
  summary: HourDetailData['summary'];
}

export function SummaryStats({ summary }: SummaryStatsProps) {
  const stats = [
    {
      icon: ChatBubbleLeftRightIcon,
      label: 'Mensajes',
      value: summary.totalMessages,
      className: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
      textClass: 'text-blue-600 dark:text-blue-400',
      valueClass: 'text-blue-900 dark:text-blue-100',
    },
    {
      icon: UserGroupIcon,
      label: 'Usuarios',
      value: summary.uniqueUsers,
      className: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
      textClass: 'text-purple-600 dark:text-purple-400',
      valueClass: 'text-purple-900 dark:text-purple-100',
    },
    {
      icon: ClockIcon,
      label: 'Resp. Prom',
      value: `${summary.avgResponseTime}ms`,
      className: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20',
      textClass: 'text-amber-600 dark:text-amber-400',
      valueClass: 'text-amber-900 dark:text-amber-100',
    },
    {
      icon: CurrencyDollarIcon,
      label: 'Costo',
      value: `$${summary.totalCost.toFixed(4)}`,
      className: 'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20',
      textClass: 'text-emerald-600 dark:text-emerald-400',
      valueClass: 'text-emerald-900 dark:text-emerald-100',
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className={`rounded-xl bg-gradient-to-br p-4 ${stat.className}`}>
            <div className="mb-1 flex items-center gap-2">
              <Icon className={`h-4 w-4 ${stat.textClass}`} />
              <span className={`text-xs ${stat.textClass}`}>{stat.label}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.valueClass}`}>{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
}
