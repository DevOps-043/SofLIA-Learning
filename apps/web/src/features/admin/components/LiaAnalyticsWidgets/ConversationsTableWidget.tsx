'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  UserCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

interface Conversation {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
  contextType: string;
  startedAt: string;
  endedAt: string | null;
  totalMessages: number;
  liaMessages: number;
  tokens: number;
  cost: number;
  avgResponseTimeMs: number;
  durationSeconds: number | null;
  isCompleted: boolean;
  deviceType: string | null;
  browser: string | null;
}

interface ConversationsTableWidgetProps {
  period?: string;
  initialContextFilter?: string;
}

const CONTEXT_LABELS: Record<string, string> = {
  course: 'Curso',
  general: 'General',
  workshop: 'Taller',
  prompts: 'Prompts',
  community: 'Comunidad',
  news: 'Noticias',
};

const CONTEXT_COLORS: Record<string, string> = {
  course: 'bg-violet-500/20 text-violet-400',
  general: 'bg-indigo-500/20 text-indigo-400',
  workshop: 'bg-teal-500/20 text-teal-400',
  prompts: 'bg-orange-500/20 text-orange-400',
  community: 'bg-pink-500/20 text-pink-400',
  news: 'bg-blue-500/20 text-blue-400',
};

export function ConversationsTableWidget({ 
  period = 'month',
  initialContextFilter 
}: ConversationsTableWidgetProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [contextFilter, setContextFilter] = useState(initialContextFilter || '');
  const [showFilters, setShowFilters] = useState(false);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (contextFilter) {
        params.append('contextType', contextFilter);
      }

      // Calcular fechas según período
      const endDate = new Date();
      let startDate = new Date();
      
      // ✅ Si period es 'all', no filtrar por fecha
      let shouldFilterByDate = true;
      
      switch (period) {
        case 'day':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        case 'all':
          shouldFilterByDate = false;
          break;
        default:
          // Por defecto, último mes
          startDate.setMonth(startDate.getMonth() - 1);
      }

      if (shouldFilterByDate) {
        params.append('startDate', startDate.toISOString());
        params.append('endDate', endDate.toISOString());
      }


      const response = await fetch(`/api/admin/lia-analytics/conversations?${params}`);
      const data = await response.json();

      if (data.success) {
        setConversations(data.data.conversations);
        setTotalPages(data.data.pagination.totalPages);
        setTotal(data.data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, period, contextFilter]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const contextOptions = [
    { value: '', label: 'Todos' },
    { value: 'course', label: 'Cursos' },
    { value: 'general', label: 'General' },
    { value: 'workshop', label: 'Talleres' },
    { value: 'prompts', label: 'Prompts' },
    { value: 'community', label: 'Comunidades' },
    { value: 'news', label: 'Noticias' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-500" />
              Conversaciones Recientes
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {total} conversaciones en total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters || contextFilter
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              } hover:bg-indigo-500/30`}
            >
              <FunnelIcon className="w-5 h-5" />
            </button>
            <button
              onClick={fetchConversations}
              disabled={isLoading}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              {contextOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setContextFilter(option.value);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    contextFilter === option.value
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Contexto
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Mensajes
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tokens
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Costo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Duración
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-14"></div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-10"></div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  </td>
                </tr>
              ))
            ) : conversations.length > 0 ? (
              conversations.map((conv) => (
                <tr
                  key={conv.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {conv.user?.avatar ? (
                        <img
                          src={conv.user.avatar}
                          alt={conv.user.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                          <UserCircleIcon className="w-5 h-5 text-indigo-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                          {conv.user?.name || 'Usuario'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        CONTEXT_COLORS[conv.contextType] || 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {CONTEXT_LABELS[conv.contextType] || conv.contextType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {conv.totalMessages}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {conv.tokens.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-emerald-500">
                    ${conv.cost.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {formatDuration(conv.durationSeconds)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(conv.startedAt)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No hay conversaciones en este período
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

