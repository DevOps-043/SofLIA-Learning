"use client";

import { Loader2, Send } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DialogueComposerProps {
  canSendMessage: boolean;
  draftMessage: string;
  isTerminal: boolean;
  onDraftMessageChange: (message: string) => void;
  onSendMessage: () => void | Promise<void>;
  sending: boolean;
}

export function DialogueComposer({
  canSendMessage,
  draftMessage,
  isTerminal,
  onDraftMessageChange,
  onSendMessage,
  sending,
}: DialogueComposerProps) {
  const { t } = useTranslation("learn");

  return (
    <>
      <div className="flex gap-2">
        <textarea
          value={draftMessage}
          onChange={event => onDraftMessageChange(event.target.value)}
          disabled={sending || isTerminal}
          rows={2}
          className="min-h-[56px] flex-1 resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-gray-900 dark:text-white dark:focus:border-accent"
          placeholder={isTerminal ? t("activities.dialogue.closedPlaceholder") : t("activities.dialogue.placeholder")}
        />
        <button
          type="button"
          onClick={() => void onSendMessage()}
          disabled={!canSendMessage}
          className="inline-flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-accent dark:text-primary"
          title={t("activities.dialogue.send")}
          aria-label={t("activities.dialogue.send")}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
      <p className="text-[11px] leading-relaxed text-gray-500 dark:text-white/40">
        {isTerminal ? t("activities.dialogue.closedHelper") : t("activities.dialogue.helper")}
      </p>
    </>
  );
}
