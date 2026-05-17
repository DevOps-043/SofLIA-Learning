"use client";

import { useTranslation } from "react-i18next";
import type { DialogueSession } from "./dialogue.types";

interface DialogueResultPanelProps {
  session: DialogueSession | null;
}

export function DialogueResultPanel({ session }: DialogueResultPanelProps) {
  const { t } = useTranslation("learn");

  if (!session?.result) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("activities.dialogue.finalFeedback")}</p>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:bg-white/10 dark:text-white/60">
          {t("activities.dialogue.metrics.score")}: {Math.round(session.result.score)}%
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
        {session.result.studentFeedback}
      </p>
    </div>
  );
}
