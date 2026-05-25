"use client";

import { Loader2, RefreshCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DialogueRetryButtonProps {
  canPracticeAgain: boolean;
  canStartNewAttempt: boolean;
  onRetrySession: () => void | Promise<void>;
  sending: boolean;
}

export function DialogueRetryButton({
  canPracticeAgain,
  canStartNewAttempt,
  onRetrySession,
  sending,
}: DialogueRetryButtonProps) {
  const { t } = useTranslation("learn");

  if (!canStartNewAttempt) return null;

  return (
    <button
      type="button"
      onClick={() => void onRetrySession()}
      disabled={sending}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
    >
      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
      {canPracticeAgain ? t("activities.dialogue.practiceAgain") : t("activities.dialogue.retryActivity")}
    </button>
  );
}
