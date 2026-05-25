import type { TFunction } from 'i18next';
import { ChevronRight, Loader2, MessageCircle, Sparkles } from 'lucide-react';
import type { LearnActivity } from '../../types';

interface AiChatActivityPanelProps {
  activity: LearnActivity;
  aiActivityCompleted: boolean;
  aiCompletionError: string | null;
  aiCompletionSaving: boolean;
  markAiChatActivityCompleted: (conversationId?: string | null) => void | Promise<void>;
  onStartAiChat: (
    activity: LearnActivity,
    onUserMessageCompleted: (conversationId?: string | null) => void | Promise<void>
  ) => void;
  t: TFunction<'learn'>;
}

export function AiChatActivityPanel({
  activity,
  aiActivityCompleted,
  aiCompletionError,
  aiCompletionSaving,
  markAiChatActivityCompleted,
  onStartAiChat,
  t
}: AiChatActivityPanelProps) {
  return (
    <div className="p-4 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/5">
        <MessageCircle className="h-5 w-5 text-gray-500 dark:text-white/50" />
      </div>
      <h4 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
        {t('activities.aiChatActivity')}
      </h4>
      <p className="mb-4 text-xs text-gray-500 dark:text-white/40">
        {t('activities.aiChatDescription')}
      </p>
      <button
        disabled={aiCompletionSaving}
        onClick={(event) => {
          event.stopPropagation();
          onStartAiChat(activity, markAiChatActivityCompleted);
        }}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-accent dark:text-primary"
      >
        {aiCompletionSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {aiActivityCompleted ? t('activities.continue') : t('activities.start')}
        <ChevronRight className="h-4 w-4 opacity-50" />
      </button>
      {aiCompletionError && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {aiCompletionError}
        </p>
      )}
    </div>
  );
}
