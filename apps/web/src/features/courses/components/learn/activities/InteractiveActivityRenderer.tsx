"use client";

import { useCallback, useMemo, useState } from "react";
import { Check, Clipboard, ExternalLink, Loader2, Sparkles } from "lucide-react";

import type { CourseLessonContext } from "@/core/types/lia.types";
import { copyTextToClipboard } from "@/lib/clipboard";
import { normalizeContentForRenderer } from "@/lib/course-content";
import {
  buildActivitySofliaEvaluationMessage,
  hasActivityResponseForSofliaEvaluation,
} from "@/features/courses/services/activity-soflia-evaluation-message.service";

import { useLiaCourse } from "../../../context/LiaCourseContext";
import { FormattedContentRenderer } from "../ContentRenderers";
import type { LearnActivity } from "../types";
import { ChecklistActivityRenderer } from "./ChecklistActivityRenderer";
import { ExternalToolActivityRenderer } from "./ExternalToolActivityRenderer";
import { InlineAnswersActivityRenderer } from "./InlineAnswersActivityRenderer";
import { LongTextActivityRenderer } from "./LongTextActivityRenderer";
import { useActivitySubmission } from "./useActivitySubmission";

function SubmissionStatusBadge({ activity }: { activity: LearnActivity }) {
  const summary = activity.latest_submission_summary;
  if (!summary) {
    return null;
  }

  const statusLabelMap: Record<string, string> = {
    draft: "Borrador",
    submitted: "Enviado",
    validated: "Validado",
    needs_revision: "Revisar",
  };

  const toneClassMap: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/60",
    submitted:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    validated:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    needs_revision:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${toneClassMap[summary.status] || toneClassMap.draft}`}
    >
      {summary.completionSatisfied && <Check className="h-3.5 w-3.5" />}
      {statusLabelMap[summary.status] || summary.status}
    </span>
  );
}

export function InteractiveActivityRenderer({
  activity,
  lessonId,
  onSubmissionSaved,
  slug,
}: {
  activity: LearnActivity;
  lessonId: string;
  onSubmissionSaved?: () => void | Promise<void>;
  slug: string;
}) {
  const [liaEvaluationPending, setLiaEvaluationPending] = useState(false);
  const [toolActionMessage, setToolActionMessage] = useState<string | null>(null);
  const {
    liaChat,
    openLia,
    closeLia,
    courseContext,
    isLiaChatLoading,
    isInteractionBlocked,
  } = useLiaCourse();
  const activityConfig = activity.activity_config;
  const normalizedContent = useMemo(
    () => normalizeContentForRenderer(activity.activity_content),
    [activity.activity_content]
  );

  const {
    error,
    feedbackMessage,
    loading,
    requestPayload,
    saving,
    setFeedbackMessage,
    state,
    submissionRequirementIssues,
    submission,
    toggleChecklistItem,
    updateEvidenceText,
    updateInlineAnswer,
    updateResponseText,
    saveDraft,
    submitActivity,
  } = useActivitySubmission({
    activity,
    lessonId,
    onSubmissionSaved,
    slug,
  });

  if (!activityConfig) {
    return (
      <FormattedContentRenderer
        content={activity.activity_content}
        activityId={activity.activity_id}
      />
    );
  }

  if (activityConfig.interactionType === "soflia_dialogue") {
    return (
      <FormattedContentRenderer
        content={activity.activity_content}
        activityId={activity.activity_id}
      />
    );
  }

  const latestEvaluation = submission?.latestEvaluation?.feedback;
  const promptText = activityConfig.toolTask?.promptTemplate?.trim() || "";
  const isSubmissionStructurallyComplete =
    submissionRequirementIssues.length === 0;
  const canEvaluateWithSoflia = hasActivityResponseForSofliaEvaluation({
    activity,
    request: requestPayload,
  });
  const isLiaBusy = isLiaChatLoading;

  const handleEvaluateWithSoflia = useCallback(async () => {
    setFeedbackMessage(null);

    if (isInteractionBlocked) {
      closeLia();
      return;
    }

    if (isLiaBusy) {
      setFeedbackMessage(
        "SofLIA ya esta generando una respuesta. Deten la generacion actual en el panel y vuelve a intentarlo."
      );
      return;
    }

    const evaluationPrompt = buildActivitySofliaEvaluationMessage({
      activity,
      request: requestPayload,
    });

    if (!evaluationPrompt) {
      setFeedbackMessage(
        "Completa al menos una respuesta antes de pedir la evaluacion de SofLIA."
      );
      return;
    }

    openLia();

    if (!liaChat?.sendMessage) {
      setFeedbackMessage(
        "SofLIA todavia no esta lista. Intenta de nuevo en unos segundos."
      );
      return;
    }

    const evaluationContext = {
      ...courseContext,
      lessonId: courseContext?.lessonId ?? lessonId,
      activitiesContext: {
        ...courseContext?.activitiesContext,
        totalActivities: 1,
        requiredActivities: activity.is_required ? 1 : 0,
        completedActivities: activity.latest_submission_summary?.completionSatisfied
          ? 1
          : 0,
        pendingRequiredCount:
          activity.is_required &&
          !activity.latest_submission_summary?.completionSatisfied
            ? 1
            : 0,
        currentActivityFocus: {
          title: activity.activity_title,
          type: activity.activity_type,
          isRequired: activity.is_required,
          isCompleted: !!activity.latest_submission_summary?.completionSatisfied,
          description: activity.activity_description || activity.activity_title,
        },
      },
    } satisfies CourseLessonContext;

    setFeedbackMessage("SofLIA esta evaluando tu actividad en el panel derecho.");
    setLiaEvaluationPending(true);

    try {
      await liaChat.sendMessage(
        evaluationPrompt,
        evaluationContext,
        undefined,
        true
      );
    } finally {
      setLiaEvaluationPending(false);
    }
  }, [
    activity,
    courseContext,
    closeLia,
    isInteractionBlocked,
    isLiaBusy,
    lessonId,
    liaChat,
    openLia,
    requestPayload,
    setFeedbackMessage,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SubmissionStatusBadge activity={activity} />
        {activityConfig.validation.enabled && (
          <span className="rounded-full bg-fuchsia-100 px-2.5 py-1 text-[11px] font-medium text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-300">
            SofLIA disponible
          </span>
        )}
        {activityConfig.validation.requiredForCompletion && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            Validacion obligatoria
          </span>
        )}
      </div>

      {activityConfig.toolTask && (
        <div className="rounded-xl border border-[#B6E5DB] bg-[#F1FBF8] px-4 py-3 dark:border-[#00D4B3]/20 dark:bg-[#08201B]">
          <div className="flex flex-wrap items-center gap-2">
            {activityConfig.toolTask.showCopyButton && promptText && (
              <button
                type="button"
                onClick={async () => {
                  const copied = await copyTextToClipboard(promptText);
                  setToolActionMessage(
                    copied
                      ? "Prompt copiado al portapapeles."
                      : "No fue posible copiar el prompt."
                  );
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-[#0A2540]/10 bg-white px-3 py-2 text-xs font-medium text-[#0A2540] transition hover:border-[#0A2540]/20 hover:bg-[#0A2540]/5 dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                <Clipboard className="h-3.5 w-3.5" />
                Copiar prompt
              </button>
            )}

            {activity.external_tool?.url && activityConfig.toolTask.openInNewTab && (
              <button
                type="button"
                onClick={() => {
                  window.open(
                    activity.external_tool?.url || "",
                    "_blank",
                    "noopener,noreferrer"
                  );
                  setToolActionMessage(
                    `Abriendo ${activity.external_tool?.label || "herramienta"} en una nueva ventana.`
                  );
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-[#0A2540]/10 bg-white px-3 py-2 text-xs font-medium text-[#0A2540] transition hover:border-[#0A2540]/20 hover:bg-[#0A2540]/5 dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir {activity.external_tool?.label || "herramienta"}
              </button>
            )}
          </div>
          {toolActionMessage && (
            <p className="mt-2 text-xs text-[#0F6A57] dark:text-[#9DE9D5]">
              {toolActionMessage}
            </p>
          )}
        </div>
      )}

      {activityConfig.interactionType === "long_text" &&
        normalizedContent.trim().length > 0 && (
          <FormattedContentRenderer
            content={activity.activity_content}
            activityId={activity.activity_id}
          />
        )}

      {activityConfig.interactionType === "external_tool_task" &&
        normalizedContent.trim().length > 0 && (
          <FormattedContentRenderer
            content={activity.activity_content}
            activityId={activity.activity_id}
          />
        )}

      {activityConfig.interactionType === "long_text" && (
        <LongTextActivityRenderer
          evidencePlaceholder={activityConfig.submission.evidencePlaceholder}
          evidenceValue={state.evidenceText}
          onEvidenceChange={updateEvidenceText}
          onResponseChange={updateResponseText}
          placeholder={activityConfig.submission.responsePlaceholder}
          responseValue={state.responseText}
        />
      )}

      {activityConfig.interactionType === "inline_answers" && (
        <InlineAnswersActivityRenderer
          content={normalizedContent}
          evidencePlaceholder={activityConfig.submission.evidencePlaceholder}
          evidenceValue={state.evidenceText}
          fields={activityConfig.submission.fields}
          onEvidenceChange={updateEvidenceText}
          onFieldChange={updateInlineAnswer}
          values={state.inlineAnswers}
        />
      )}

      {activityConfig.interactionType === "checklist" && (
        <ChecklistActivityRenderer
          content={normalizedContent}
          evidencePlaceholder={activityConfig.submission.evidencePlaceholder}
          evidenceValue={state.evidenceText}
          items={activityConfig.submission.checklistItems}
          noteValue={state.responseText}
          onEvidenceChange={updateEvidenceText}
          onNoteChange={updateResponseText}
          onToggleItem={toggleChecklistItem}
          values={state.checklist}
        />
      )}

      {activityConfig.interactionType === "external_tool_task" && (
        <ExternalToolActivityRenderer
          evidencePlaceholder={activityConfig.submission.evidencePlaceholder}
          evidenceValue={state.evidenceText}
          onEvidenceChange={updateEvidenceText}
          onResponseChange={updateResponseText}
          promptTemplate={activityConfig.toolTask.promptTemplate}
          responseValue={state.responseText}
        />
      )}

      {(error || feedbackMessage) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
              : "border-[#B6E5DB] bg-[#F1FBF8] text-[#0F6A57] dark:border-[#00D4B3]/20 dark:bg-[#08201B] dark:text-[#9DE9D5]"
          }`}
        >
          {error || feedbackMessage}
        </div>
      )}

      {!loading && submissionRequirementIssues.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          <p className="font-medium">Falta completar la configuracion requerida de esta actividad.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {submissionRequirementIssues.map((issue) => (
              <li key={issue.code}>{issue.message}</li>
            ))}
          </ul>
        </div>
      )}

      {latestEvaluation && (
        <div className="rounded-xl border border-[#E3D9FF] bg-[#F7F4FF] px-4 py-4 dark:border-[#7E67BA]/30 dark:bg-[#171127]">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#6E57B5] dark:text-[#BFAEFF]" />
            <p className="text-sm font-semibold text-[#4C3A85] dark:text-[#D7CBFF]">
              Retroalimentacion SofLIA
            </p>
          </div>
          <p className="text-sm leading-relaxed text-[#4C3A85] dark:text-[#E7E0FF]">
            {latestEvaluation.summary}
          </p>
          {latestEvaluation.strengths.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#6E57B5] dark:text-[#BFAEFF]">
                Fortalezas
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-[#4C3A85] dark:text-[#E7E0FF]">
                {latestEvaluation.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {latestEvaluation.improvements.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#6E57B5] dark:text-[#BFAEFF]">
                A mejorar
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-[#4C3A85] dark:text-[#E7E0FF]">
                {latestEvaluation.improvements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-3 text-sm font-medium text-[#4C3A85] dark:text-[#E7E0FF]">
            Siguiente paso: {latestEvaluation.suggestedNextStep}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setFeedbackMessage(null);
            void saveDraft();
          }}
          disabled={loading || saving || liaEvaluationPending}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Guardar borrador
        </button>
        <button
          type="button"
          onClick={() => {
            setFeedbackMessage(null);
            void submitActivity();
          }}
          disabled={
            loading ||
            saving ||
            liaEvaluationPending ||
            !isSubmissionStructurallyComplete
          }
          className="inline-flex items-center gap-2 rounded-lg bg-[#0A2540] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0d2f4d] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#00D4B3] dark:text-[#08141F] dark:hover:bg-[#00b79c]"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enviar actividad
        </button>
        {activityConfig.validation.enabled && (
          <button
            type="button"
            onClick={() => {
              void handleEvaluateWithSoflia();
            }}
            disabled={
              loading ||
              saving ||
              liaEvaluationPending ||
              isLiaBusy ||
              !isSubmissionStructurallyComplete ||
              !canEvaluateWithSoflia
            }
            className="inline-flex items-center gap-2 rounded-lg border border-[#6E57B5]/20 bg-[#F7F4FF] px-4 py-2 text-sm font-medium text-[#4C3A85] transition hover:bg-[#EFE8FF] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#7E67BA]/30 dark:bg-[#171127] dark:text-[#D7CBFF] dark:hover:bg-[#211937]"
          >
            {liaEvaluationPending || isLiaBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Evaluar con SofLIA
          </button>
        )}
      </div>
    </div>
  );
}
