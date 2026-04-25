'use client';

import { AlertCircle, CheckCircle, Loader2, RefreshCw, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import type {
  DashboardMessage,
  StudyPlannerAction,
} from '../../hooks/useStudyPlannerDashboardSofLIA';

interface StudyPlannerDashboardAssistantMessageProps {
  isBusy: boolean;
  message: DashboardMessage;
  onExecuteAction: (action: StudyPlannerAction, data: Record<string, unknown>) => Promise<void>;
}

function canRetryAction(message: DashboardMessage): boolean {
  if (message.actionStatus !== 'error' || !message.actionType) {
    return false;
  }

  return ![
    'invalid_action_data',
    'invalid_action_json',
    'invalid_action_schema',
  ].includes(message.actionCode || '');
}

export function StudyPlannerDashboardAssistantMessage({
  isBusy,
  message,
  onExecuteAction,
}: StudyPlannerDashboardAssistantMessageProps) {
  const { t } = useTranslation('common');
  const text = {
    actionCompleted: t('studyPlanner.dashboardAssistant.actionCompleted', {
      defaultValue: 'Acción completada',
    }),
    confirmationRequired: t('studyPlanner.dashboardAssistant.confirmationRequired', {
      defaultValue: 'Se requiere confirmación antes de aplicar el cambio',
    }),
    actionFailed: t('studyPlanner.dashboardAssistant.actionFailed', {
      defaultValue: 'Acción con error',
    }),
    errorCode: t('studyPlanner.dashboardAssistant.errorCode', { defaultValue: 'Código' }),
    traceId: t('studyPlanner.dashboardAssistant.traceId', { defaultValue: 'Trace ID' }),
    confirm: t('actions.confirm', { defaultValue: 'Confirmar' }),
    retry: t('actions.retry', { defaultValue: 'Reintentar' }),
  };
  const isUser = message.role === 'user';
  const canConfirm = !isUser && message.actionStatus === 'confirmation_needed' && !!message.actionType;
  const canRetry = !isUser && canRetryAction(message);

  const actionPayload: Record<string, unknown> = {
    ...(message.actionData || {}),
  };

  if (message.traceId) {
    actionPayload.traceId = message.traceId;
  }

  const handleExecute = () => {
    if (!message.actionType) {
      return;
    }

    void onExecuteAction(message.actionType, actionPayload);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="mr-2 flex-shrink-0">
          <img
            src="/lia-avatar.png"
            alt="SofLIA"
            width={32}
            height={32}
            className="rounded-full object-cover"
          />
        </div>
      )}
      <div
        className={`max-w-[85%] px-4 py-3 ${
          isUser
            ? 'rounded-[16px_16px_4px_16px] bg-primary text-white dark:bg-primary'
            : 'rounded-[16px_16px_16px_4px] bg-gray-100 text-gray-900 dark:bg-carbon-800 dark:text-white'
        }`}
      >
        <div className="m-0 whitespace-pre-wrap text-sm leading-relaxed">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              ul: ({ children }) => <ul className="my-2 list-disc pl-5">{children}</ul>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {message.actionStatus === 'success' && (
          <div className="mt-2 flex items-center gap-1 text-xs text-green-500">
            <CheckCircle className="h-3 w-3" />
            <span>{text.actionCompleted}</span>
          </div>
        )}

        {message.actionStatus === 'confirmation_needed' && (
          <div className="mt-2 flex items-center gap-1 text-xs text-amber-500">
            <AlertCircle className="h-3 w-3" />
            <span>{text.confirmationRequired}</span>
          </div>
        )}

        {message.actionStatus === 'error' && (
          <div className="mt-2 flex items-center gap-1 text-xs text-red-500">
            <XCircle className="h-3 w-3" />
            <span>{text.actionFailed}</span>
          </div>
        )}

        {(message.actionCode || message.traceId) && (
          <div className="mt-2 space-y-1 text-[11px] text-gray-500 dark:text-gray-400">
            {message.actionCode && (
              <p className="m-0 break-all">
                {text.errorCode}: {message.actionCode}
              </p>
            )}
            {message.traceId && (
              <p className="m-0 break-all">
                {text.traceId}: {message.traceId}
              </p>
            )}
          </div>
        )}

        {(canConfirm || canRetry) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {canConfirm && (
              <button
                type="button"
                onClick={handleExecute}
                disabled={isBusy}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="h-3.5 w-3.5" />
                )}
                <span>{text.confirm}</span>
              </button>
            )}

            {canRetry && (
              <button
                type="button"
                onClick={handleExecute}
                disabled={isBusy}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-transparent px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-white/10 dark:text-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                <span>{text.retry}</span>
              </button>
            )}
          </div>
        )}

        <p
          className={`mb-0 mt-1.5 text-[10px] ${
            isUser ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {message.timestamp.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
