import {
  CheckCircleIcon,
  ClockIcon,
  UsersIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType } from 'react';
import type { AccessRequestStats } from './types';

interface AccessRequestsStatsProps {
  stats: AccessRequestStats;
}

const statCardClassName = 'bg-gray-900 rounded-xl p-6 border border-gray-700';

export function AccessRequestsStats({ stats }: AccessRequestsStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard icon={ClockIcon} label="Pendientes" value={stats.totalPending} iconClassName="text-yellow-400" surfaceClassName="bg-yellow-600/20" />
      <StatCard icon={CheckCircleIcon} label="Aprobadas" value={stats.totalApproved} iconClassName="text-green-400" surfaceClassName="bg-green-600/20" />
      <StatCard icon={XCircleIcon} label="Rechazadas" value={stats.totalRejected} iconClassName="text-red-400" surfaceClassName="bg-red-600/20" />
      <StatCard icon={UsersIcon} label="Total" value={stats.totalRequests} iconClassName="text-blue-400" surfaceClassName="bg-blue-600/20" />
    </div>
  );
}

function StatCard({
  icon: Icon,
  iconClassName,
  label,
  surfaceClassName,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  iconClassName: string;
  label: string;
  surfaceClassName: string;
  value: number;
}) {
  return (
    <div className={statCardClassName}>
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${surfaceClassName}`}>
          <Icon className={`h-6 w-6 ${iconClassName}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
