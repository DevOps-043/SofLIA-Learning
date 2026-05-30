"use client";

import { AlertCircle, CheckCircle2, Clock3, MessageSquareText, Sparkles, Target } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getStateTone } from "./dialogue-state";
import type { DialogueSession } from "./dialogue.types";
import { DialogueMetricCard } from "./DialogueMetricCard";

interface DialogueHeaderProps {
  canPracticeAgain: boolean;
  canRetry: boolean;
  criteriaProgress: number;
  scoreValue: number;
  session: DialogueSession | null;
  stateLabel: string;
  totalCriteria: number;
}

export function DialogueHeader({
  canPracticeAgain,
  canRetry,
  criteriaProgress,
  scoreValue,
  session,
  stateLabel,
  totalCriteria,
}: DialogueHeaderProps) {
  const { t } = useTranslation("learn");

  return (
    <div className="border-b border-gray-200 bg-gray-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.03] sm:px-4 sm:py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-2 sm:gap-3">
          <div className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 overflow-hidden rounded-lg border border-accent/30 bg-accent/10">
            <img src="/lia-avatar.webp" alt="SofLIA" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
              {t("activities.dialogue.title")}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-white/50 hidden sm:block">
              {t("activities.dialogue.subtitle")}
            </p>
          </div>
        </div>
        <span className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] sm:px-2.5 sm:py-1 sm:text-[11px] font-medium ${getStateTone(session?.state)}`}>
          {canPracticeAgain ? <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : canRetry ? <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
          {stateLabel}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5 sm:mt-4 sm:gap-3">
        <DialogueMetricCard icon={<Target className="h-3 w-3 sm:h-3.5 sm:w-3.5" />} label={t("activities.dialogue.metrics.criteria")} value={`${session?.criteriaMet.length || 0}/${totalCriteria || 0}`}>
          <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10 sm:mt-2 sm:h-1">
            <div className="h-full rounded-full bg-accent" style={{ width: `${criteriaProgress}%` }} />
          </div>
        </DialogueMetricCard>
        <DialogueMetricCard icon={<MessageSquareText className="h-3 w-3 sm:h-3.5 sm:w-3.5" />} label={t("activities.dialogue.metrics.turns")} value={session?.turnsCount || 0} />
        <DialogueMetricCard icon={<Clock3 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />} label={t("activities.dialogue.metrics.score")} value={`${scoreValue}%`} />
      </div>
    </div>
  );
}
