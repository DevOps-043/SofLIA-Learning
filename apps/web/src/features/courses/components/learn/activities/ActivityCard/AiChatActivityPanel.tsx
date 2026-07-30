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
    <div className="px-3 py-6 text-center sm:px-6">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border" style={{ borderColor: 'color-mix(in srgb, var(--learn-accent) 20%, transparent)', backgroundColor: 'color-mix(in srgb, var(--learn-accent) 8%, transparent)', color: 'var(--learn-accent)' }}>
        <MessageCircle className="h-5 w-5" />
      </div>
      <h4 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
        {t('activities.aiChatActivity')}
      </h4>
      <p className="mx-auto mb-5 max-w-lg text-xs leading-relaxed text-gray-500 dark:text-white/45">
        {t('activities.aiChatDescription')}
      </p>
      <button
        disabled={aiCompletionSaving}
        onClick={(event) => {
          event.stopPropagation();
          onStartAiChat(activity, markAiChatActivityCompleted);
        }}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ backgroundColor: 'var(--learn-action)', borderColor: 'color-mix(in srgb, var(--learn-action) 28%, transparent)', boxShadow: '0 0.55rem 1.25rem color-mix(in srgb, var(--learn-action) 14%, transparent)', color: 'var(--learn-on-action)' }}
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
