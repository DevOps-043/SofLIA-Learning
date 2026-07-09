"use client";

import { Clock, Loader2, RefreshCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DialogueInactivityNoticeProps {
  onContinue: () => void;
  onRestart: () => void | Promise<void>;
  sending: boolean;
  show: boolean;
}

/**
 * Notice shown after 3 minutes without activity in a SofLIA dialogue:
 * offers restarting the activity (fresh session) or continuing where the
 * user left off (the server keeps abandoned sessions resumable).
 */
export function DialogueInactivityNotice({
  onContinue,
  onRestart,
  sending,
  show,
}: DialogueInactivityNoticeProps) {
  const { t } = useTranslation("learn");

  if (!show) return null;

  return (
    <div
      role="alert"
      className="animate-[fadeIn_0.3s_ease-out] rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 dark:border-amber-400/30 dark:bg-amber-400/10"
    >
      <div className="flex items-start gap-3">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            {t("activities.dialogue.inactivity.title")}
          </p>
          <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-300/90">
            {t("activities.dialogue.inactivity.message")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void onRestart()}
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-500 dark:text-amber-950 dark:hover:bg-amber-400"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              {t("activities.dialogue.inactivity.restart")}
            </button>
            <button
              type="button"
              onClick={onContinue}
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-300/70 bg-white px-3 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-400/30 dark:bg-transparent dark:text-amber-200 dark:hover:bg-amber-400/10"
            >
              {t("activities.dialogue.inactivity.continue")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
