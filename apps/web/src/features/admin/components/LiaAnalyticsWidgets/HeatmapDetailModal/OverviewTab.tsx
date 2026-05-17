import { CalendarDaysIcon, ChartPieIcon, CpuChipIcon, SparklesIcon } from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';
import { CONTEXT_COLORS } from './constants';
import { formatDate } from './formatters';
import type { HourDetailData } from './types';

interface OverviewTabProps {
  data: HourDetailData;
}

export function OverviewTab({ data }: OverviewTabProps) {
  const averageTokens = Math.round(
    data.summary.totalTokens / Math.max(data.summary.uniqueConversations, 1),
  );

  return (
    <div className="space-y-4">
      <InfoBlock icon={ChartPieIcon} title="Distribucion por Contexto">
        {data.contextDistribution.map((ctx) => (
          <span
            key={ctx.context}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              CONTEXT_COLORS[ctx.context] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {ctx.context}: {ctx.count} ({ctx.percentage}%)
          </span>
        ))}
      </InfoBlock>
      <InfoBlock icon={CpuChipIcon} title="Modelos Utilizados">
        {data.modelsUsed.map((model) => (
          <span
            key={model.model}
            className="rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
          >
            {model.model}: {model.count} respuestas
          </span>
        ))}
      </InfoBlock>
      <InfoBlock icon={CalendarDaysIcon} title="Fechas con Actividad">
        {data.activityDates.map((date) => (
          <span key={date} className="rounded-lg bg-gray-200 px-3 py-1 text-xs text-gray-700 dark:bg-gray-600 dark:text-gray-200">
            {formatDate(date)}
          </span>
        ))}
      </InfoBlock>
      <div className="rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 p-4 dark:from-violet-900/20 dark:to-purple-900/20">
        <div className="flex items-start gap-2">
          <SparklesIcon className="mt-0.5 h-4 w-4 text-violet-500" />
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-200">
              <span className="font-semibold">{data.summary.totalTokens.toLocaleString()}</span> tokens utilizados en{' '}
              <span className="font-semibold">{data.summary.uniqueConversations}</span> conversaciones
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Promedio: {averageTokens} tokens/conversacion
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ children, icon: Icon, title }: { children: ReactNode; icon: typeof ChartPieIcon; title: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
        <Icon className="h-4 w-4" />
        {title}
      </h4>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
