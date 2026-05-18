'use client';

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react';
import { UserCircleIcon, TrophyIcon, UsersIcon } from '@heroicons/react/24/outline';

interface TopUser {
  rank: number;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: string | null;
  } | null;
  stats: {
    conversations: number;
    messages: number;
    liaMessages: number;
    tokens: number;
    cost: number;
    avgTokensPerConversation: number;
    avgCostPerConversation: number;
  };
}

interface TopUsersWidgetProps {
  period?: string;
  limit?: number;
  isLoading?: boolean;
}

type SortBy = 'cost' | 'tokens' | 'messages' | 'conversations';

export function TopUsersWidget({ period = 'month', limit = 10, isLoading: externalLoading }: TopUsersWidgetProps) {
  const [users, setUsers] = useState<TopUser[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('cost');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTopUsers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/admin/lia-analytics/top-users?period=${period}&limit=${limit}&sortBy=${sortBy}`
        );
        const data = await response.json();
        
        if (data.success) {
          setUsers(data.data.users);
        }
      } catch (error) {
        techDebtLogger.error('Error fetching top users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopUsers();
  }, [period, limit, sortBy]);

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-500">
            <TrophyIcon className="w-4 h-4" />
          </div>
        );
      case 2:
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-400/20 text-gray-400">
            <span className="text-xs font-bold">2</span>
          </div>
        );
      case 3:
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-700">
            <span className="text-xs font-bold">3</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
            <span className="text-xs font-medium">{rank}</span>
          </div>
        );
    }
  };

  const sortOptions: { value: SortBy; label: string }[] = [
    { value: 'cost', label: 'Por Costo' },
    { value: 'tokens', label: 'Por Tokens' },
    { value: 'messages', label: 'Por Mensajes' },
    { value: 'conversations', label: 'Por Conversaciones' },
  ];

  if (isLoading || externalLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <UsersIcon className="w-5 h-5 text-indigo-500" />
          Top Usuarios de SofLIA
        </h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-3 py-1.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {users.length > 0 ? (
        <div className="space-y-2">
          {users.map((item) => (
            <div
              key={item.user?.id || item.rank}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              {getRankBadge(item.rank)}
              
              {item.user?.avatar ? (
                <img
                  src={item.user.avatar}
                  alt={item.user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <UserCircleIcon className="w-6 h-6 text-indigo-500" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {item.user?.name || 'Usuario desconocido'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {item.user?.email}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-emerald-500">
                  ${item.stats.cost.toFixed(4)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatNumber(item.stats.tokens)} tokens
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          No hay datos de usuarios
        </div>
      )}
    </div>
  );
}

