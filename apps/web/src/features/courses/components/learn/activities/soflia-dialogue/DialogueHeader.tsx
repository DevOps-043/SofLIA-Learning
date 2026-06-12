"use client";

import { AlertCircle, CheckCircle2, Gauge, MessageSquareText, Sparkles, Target } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getStateTone } from "./dialogue-state";
import type { DialogueSession } from "./dialogue.types";
import { DialogueMetricBar } from "./DialogueMetricBar";

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
    <div className="border-b border-gray-200 bg-gray-50/70 px-4 py-4 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl ring-1 ring-accent/30">
            <img src="/lia-avatar.webp" alt="SofLIA" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {t("activities.dialogue.title")}
            </p>
            <p className="mt-0.5 hidden text-xs leading-relaxed text-gray-500 dark:text-white/50 sm:block">
              {t("activities.dialogue.subtitle")}
            </p>
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStateTone(session?.state)}`}>
            {canPracticeAgain ? <CheckCircle2 className="h-3.5 w-3.5" /> : canRetry ? <AlertCircle className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
            {stateLabel}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400 dark:text-white/40">
            <MessageSquareText className="h-3 w-3" />
            {session?.turnsCount || 0} {t("activities.dialogue.metrics.turns")}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <DialogueMetricBar
          icon={<Target className="h-3.5 w-3.5" />}
          label={t("activities.dialogue.metrics.criteria")}
          progress={criteriaProgress}
          valueText={`${session?.criteriaMet.length || 0}/${totalCriteria || 0}`}
        />
        <DialogueMetricBar
          icon={<Gauge className="h-3.5 w-3.5" />}
          label={t("activities.dialogue.metrics.score")}
          progress={scoreValue}
          valueText={`${scoreValue}%`}
        />
      </div>
    </div>
  );
}
