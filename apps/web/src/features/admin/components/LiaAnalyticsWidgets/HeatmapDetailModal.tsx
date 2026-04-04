'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import {
  XMarkIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  CalendarDaysIcon,
  CpuChipIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline';

interface HourDetailData {
  slot: {
    dayOfWeek: number;
    dayName: string;
    hour: number;
    hourFormatted: string;
  };
  summary: {
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    uniqueUsers: number;
    uniqueConversations: number;
    totalTokens: number;
    totalCost: number;
    avgResponseTime: number;
  };
  topUsers: Array<{
    name: string;
    email?: string;
    avatar?: string;
    messageCount: number;
    conversationCount: number;
    questions: string[];
    tokens: number;
    cost: number;
  }>;
  topQuestions: Array<{
    content: string;
    timestamp: string;
    responseTime: number | null;
  }>;
  contextDistribution: Array<{
    context: string;
    count: number;
    percentage: number;
  }>;
  modelsUsed: Array<{
    model: string;
    count: number;
  }>;
  activityDates: string[];
}

interface HeatmapDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayOfWeek: number;
  hour: number;
  period: string;
}

const CONTEXT_COLORS: Record<string, string> = {
  course: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  general: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  activity: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  workshop: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

export function HeatmapDetailModal({ isOpen, onClose, dayOfWeek, hour, period }: HeatmapDetailModalProps) {
  const [data, setData] = useState<HourDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'questions'>('overview');
  const tabs: Array<{
    icon: typeof ChartPieIcon;
    id: 'overview' | 'users' | 'questions';
    label: string;
  }> = [
    { id: 'overview', label: 'Resumen', icon: ChartPieIcon },
    { id: 'users', label: 'Usuarios', icon: UserGroupIcon },
    { id: 'questions', label: 'Preguntas', icon: ChatBubbleLeftRightIcon },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, dayOfWeek, hour, period]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/lia-analytics/hour-detail?dayOfWeek=${dayOfWeek}&hour=${hour}&period=${period}`
      );
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching hour detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Transition appear show={isOpen}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <DialogTitle className="text-xl font-bold text-white">
                        {data?.slot.dayName} a las {data?.slot.hourFormatted}
                      </DialogTitle>
                      <p className="text-emerald-100 text-sm mt-1">
                        Detalle de actividad de SofLIA
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="p-8">
                    <div className="animate-pulse space-y-4">
                      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                      <div className="grid grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        ))}
                      </div>
                      <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    </div>
                  </div>
                ) : data ? (
                  <div className="p-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs text-blue-600 dark:text-blue-400">Mensajes</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {data.summary.totalMessages}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <UserGroupIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs text-purple-600 dark:text-purple-400">Usuarios</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                          {data.summary.uniqueUsers}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <ClockIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-xs text-amber-600 dark:text-amber-400">Resp. Prom</span>
                        </div>
                        <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                          {data.summary.avgResponseTime}ms
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <CurrencyDollarIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs text-emerald-600 dark:text-emerald-400">Costo</span>
                        </div>
                        <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                          ${data.summary.totalCost.toFixed(4)}
                        </p>
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
                      {tabs.map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`
                            flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
                            ${activeTab === tab.id
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-b-2 border-emerald-500'
                              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }
                          `}
                        >
                          <tab.icon className="w-4 h-4" />
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    <div className="max-h-[400px] overflow-y-auto">
                      {activeTab === 'overview' && (
                        <div className="space-y-4">
                          {/* Context Distribution */}
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                              <ChartPieIcon className="w-4 h-4" />
                              Distribución por Contexto
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {data.contextDistribution.map(ctx => (
                                <span
                                  key={ctx.context}
                                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                                    CONTEXT_COLORS[ctx.context] || 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {ctx.context}: {ctx.count} ({ctx.percentage}%)
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Models Used */}
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                              <CpuChipIcon className="w-4 h-4" />
                              Modelos Utilizados
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {data.modelsUsed.map(m => (
                                <span
                                  key={m.model}
                                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                                >
                                  {m.model}: {m.count} respuestas
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Activity Dates */}
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                              <CalendarDaysIcon className="w-4 h-4" />
                              Fechas con Actividad
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {data.activityDates.map(date => (
                                <span
                                  key={date}
                                  className="px-3 py-1 rounded-lg text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
                                >
                                  {formatDate(date)}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Tokens Info */}
                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl p-4">
                            <div className="flex items-start gap-2">
                              <SparklesIcon className="w-4 h-4 text-violet-500 mt-0.5" />
                              <div>
                                <p className="text-sm text-gray-700 dark:text-gray-200">
                                  <span className="font-semibold">{data.summary.totalTokens.toLocaleString()}</span> tokens utilizados
                                  en <span className="font-semibold">{data.summary.uniqueConversations}</span> conversaciones
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Promedio: {Math.round(data.summary.totalTokens / Math.max(data.summary.uniqueConversations, 1))} tokens/conversación
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'users' && (
                        <div className="space-y-3">
                          {data.topUsers.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No hay datos de usuarios</p>
                          ) : (
                            data.topUsers.map((user, index) => (
                              <div
                                key={index}
                                className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <div className="flex items-start gap-3">
                                  {/* Avatar */}
                                  <div className="flex-shrink-0">
                                    {user.avatar ? (
                                      <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="w-10 h-10 rounded-full"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                                        {user.name.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </div>

                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                                        {user.name}
                                      </p>
                                      {index < 3 && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                          #{index + 1}
                                        </span>
                                      )}
                                    </div>
                                    {user.email && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {user.email}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-600 dark:text-gray-300">
                                      <span>{user.messageCount} msgs</span>
                                      <span>•</span>
                                      <span>{user.conversationCount} conv</span>
                                      <span>•</span>
                                      <span>{user.tokens.toLocaleString()} tokens</span>
                                      <span>•</span>
                                      <span>${user.cost.toFixed(4)}</span>
                                    </div>

                                    {/* Sample questions */}
                                    {user.questions.length > 0 && (
                                      <div className="mt-2 space-y-1">
                                        {user.questions.slice(0, 2).map((q, qi) => (
                                          <p key={qi} className="text-xs text-gray-500 dark:text-gray-400 italic truncate">
                                            "{q}..."
                                          </p>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {activeTab === 'questions' && (
                        <div className="space-y-3">
                          {data.topQuestions.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No hay preguntas registradas</p>
                          ) : (
                            data.topQuestions.map((q, index) => (
                              <div
                                key={index}
                                className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4"
                              >
                                <p className="text-sm text-gray-900 dark:text-white">
                                  "{q.content}"
                                </p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                  <span>{formatDate(q.timestamp)} {formatTime(q.timestamp)}</span>
                                  {q.responseTime && (
                                    <>
                                      <span>•</span>
                                      <span className="text-emerald-600 dark:text-emerald-400">
                                        Respuesta en {q.responseTime}ms
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No se pudieron cargar los datos
                  </div>
                )}

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Datos del período: {period === 'month' ? 'Último mes' : period}
                    </p>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
