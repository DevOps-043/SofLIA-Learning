"use client";

import { useState } from "react";
import type { TFunction } from "i18next";
import {
  Activity,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  HelpCircle,
  Loader2,
  MessageCircle,
  Sparkles,
  ZoomIn,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { FormattedContentRenderer, PromptsRenderer } from "../ContentRenderers";
import { QuizRenderer } from "../QuizRenderer";
import { InteractiveActivityRenderer } from "./InteractiveActivityRenderer";
import { SofliaDialogueActivityRenderer } from "./SofliaDialogueActivityRenderer";
import {
  findQuizStatusItem,
  getNormalizedActivityContent,
  resolveQuizPayload,
} from "./utils";
import type { LearnActivity, LessonQuizStatus } from "../types";

type ActivityCardProps = {
  activity: LearnActivity;
  isCollapsed: boolean;
  lessonId: string;
  onQuizSubmitted: () => void | Promise<void>;
  onStartAiChat: (
    activity: LearnActivity,
    onUserMessageCompleted: (conversationId?: string | null) => void | Promise<void>
  ) => void;
  onToggle: (activityId: string) => void;
  onRequestQuizFeedback: (
    prompt: string,
    source?: { activityId?: string | null; materialId?: string | null },
  ) => void | Promise<void>;
  quizStatus: LessonQuizStatus | null;
  slug: string;
};

function QuizFallback({
  message,
  rawContent,
  tone = "warning",
}: {
  message: string;
  rawContent: unknown;
  tone?: "danger" | "warning";
}) {
  const colorClasses =
    tone === "danger"
      ? "text-red-600 dark:text-red-400"
      : "text-amber-700 dark:text-amber-300";

  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <p className={`${colorClasses} mb-2`}>{message}</p>
      <div
        className="whitespace-pre-wrap text-primary dark:text-white"
        style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
      >
        {typeof rawContent === "string"
          ? rawContent
          : JSON.stringify(rawContent, null, 2)}
      </div>
    </div>
  );
}

function CompletionBadge({ activity, t }: { activity: LearnActivity, t: TFunction<"learn"> }) {
  if (activity.activity_type === "quiz") {
    return null;
  }

  if (activity.is_completed || activity.latest_submission_summary?.completionSatisfied) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
        <Check className="h-2.5 w-2.5" /> {t("activities.completed")}
      </span>
    );
  }

  if (activity.latest_submission_summary?.status === "needs_revision") {
    return (
      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
        {t("activities.needsRevision")}
      </span>
    );
  }

  return null;
}

export function ActivityCard({
  activity,
  isCollapsed,
  lessonId,
  onQuizSubmitted,
  onStartAiChat,
  onToggle,
  onRequestQuizFeedback,
  quizStatus,
  slug,
}: ActivityCardProps) {
  const { t } = useTranslation("learn");
  const isSofliaDialogue =
    activity.activity_config?.interactionType === "soflia_dialogue";
  const isAiChat = activity.activity_type === "ai_chat" && !isSofliaDialogue;
  const isSofliaActivity = isAiChat || isSofliaDialogue;
  const isQuiz = activity.activity_type === "quiz";
  const isInteractive = Boolean(activity.activity_config);
  const normalizedActivityContent = getNormalizedActivityContent(activity);
  const hasActivityContent = normalizedActivityContent.trim().length > 0;
  const shouldShowActivityCard =
    isQuiz || isAiChat || isInteractive || hasActivityContent;
  const quizInfo = isQuiz
    ? findQuizStatusItem(quizStatus, activity.activity_id, "activity")
    : undefined;
  const [aiCompletionCompleted, setAiCompletionCompleted] = useState(false);
  const [aiCompletionSaving, setAiCompletionSaving] = useState(false);
  const [aiCompletionError, setAiCompletionError] = useState<string | null>(null);
  const [contentZoom, setContentZoom] = useState(1);
  const ZOOM_STEPS = [1, 1.15, 1.3, 1.5];
  const canZoomIn = contentZoom < ZOOM_STEPS[ZOOM_STEPS.length - 1];
  const canZoomOut = contentZoom > ZOOM_STEPS[0];
  const aiActivityCompleted = Boolean(activity.is_completed || aiCompletionCompleted);

  const markAiChatActivityCompleted = async (conversationId?: string | null) => {
    if (aiActivityCompleted || aiCompletionSaving) {
      return;
    }

    try {
      setAiCompletionSaving(true);
      setAiCompletionError(null);

      const response = await fetch("/api/lia/complete-activity", {
        body: JSON.stringify({
          activityType: activity.activity_id,
          conversationId,
          generatedOutput: {
            source: "course_ai_chat_activity_user_message",
            title: activity.activity_title,
            type: activity.activity_type,
          },
          requireUserMessage: true,
        }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : t("activities.aiCompletionError")
        );
      }

      setAiCompletionCompleted(true);
      void Promise.resolve(onQuizSubmitted()).catch(() => undefined);
    } catch (error) {
      setAiCompletionError(
        error instanceof Error
          ? error.message
          : t("activities.aiCompletionError")
      );
    } finally {
      setAiCompletionSaving(false);
    }
  };

  return (
    <div
      data-activity-card-id={activity.activity_id}
      className="scroll-mt-6 rounded-lg border border-gray-200 bg-white shadow-sm transition-colors hover:bg-gray-50 dark:border-white/5 dark:bg-white/[0.02] dark:shadow-none dark:hover:bg-white/[0.04]"
    >
      <button
        onClick={(event) => {
          event.stopPropagation();
          onToggle(activity.activity_id);
        }}
        className="flex w-full items-center gap-3 px-4 py-3"
      >
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
            isSofliaActivity
              ? "overflow-hidden border border-accent/25 bg-accent/10 dark:bg-accent/15"
              : "bg-gray-100 dark:bg-white/5"
          }`}
        >
          {isSofliaActivity ? (
            <img
              src="/lia-avatar.webp"
              alt="SofLIA"
              className="h-full w-full object-cover"
            />
          ) : isQuiz ? (
            <FileText className="h-4 w-4 text-gray-500 dark:text-white/60" />
          ) : activity.activity_type === "reading" ? (
            <BookOpen className="h-4 w-4 text-gray-500 dark:text-white/60" />
          ) : (
            <Activity className="h-4 w-4 text-gray-500 dark:text-white/60" />
          )}
        </div>

        <div className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
              {activity.activity_title}
            </span>
            {activity.is_required && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                {t("activities.required")}
              </span>
            )}
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                isSofliaActivity
                  ? "border border-accent/20 bg-accent/10 text-primary dark:bg-accent/15 dark:text-accent"
                  : "capitalize bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-white/40"
              }`}
            >
              {isSofliaActivity ? t("activities.sofliaActivityType") : activity.activity_type}
            </span>
            {activity.is_required && quizInfo?.isPassed && (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                <Check className="h-2.5 w-2.5" /> {t("activities.completed")}
              </span>
            )}
            {activity.is_required &&
              quizInfo?.isCompleted &&
              !quizInfo.isPassed && (
                <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  {t("activities.attempted")} {quizInfo.percentage}%
                </span>
              )}
            <CompletionBadge
              t={t}
              activity={
                aiActivityCompleted ? { ...activity, is_completed: true } : activity
              }
            />
          </div>
        </div>

        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform dark:text-white/30 ${
            !isCollapsed ? "rotate-180" : ""
          }`}
        />
      </button>

      {!isCollapsed && (
        <div className="border-t border-gray-100 px-4 pb-4 dark:border-white/5">
          {activity.activity_description && (
            <p className="mb-3 mt-3 text-xs leading-relaxed text-gray-500 dark:text-white/40">
              {activity.activity_description}
            </p>
          )}

          {shouldShowActivityCard && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-white/5 dark:bg-white/[0.02]">
              {isQuiz && (() => {
                const quizPayload = resolveQuizPayload(activity.activity_content);

                if (!quizPayload) {
                  return (
                    <QuizFallback
                      message={t("activities.quizError")}
                      rawContent={activity.activity_content}
                    />
                  );
                }

                return (
                  <QuizRenderer
                    quizData={quizPayload.questions}
                    totalPoints={quizPayload.totalPoints}
                    quizStatusItem={quizInfo}
                    lessonId={lessonId}
                    slug={slug}
                    activityId={activity.activity_id}
                    onRequestQuizFeedback={(prompt) => {
                      void onRequestQuizFeedback(prompt, {
                        activityId: activity.activity_id,
                      });
                    }}
                    onQuizSubmitted={() => {
                      void onQuizSubmitted();
                    }}
                  />
                );
              })()}

              {isSofliaDialogue ? (
                <SofliaDialogueActivityRenderer
                  activity={activity}
                  lessonId={lessonId}
                  onSessionUpdated={onQuizSubmitted}
                  slug={slug}
                />
              ) : isAiChat ? (
                <div className="p-4 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/5">
                    <MessageCircle className="h-5 w-5 text-gray-500 dark:text-white/50" />
                  </div>
                  <h4 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
                    {t("activities.aiChatActivity")}
                  </h4>
                  <p className="mb-4 text-xs text-gray-500 dark:text-white/40">
                    {t("activities.aiChatDescription")}
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
                    {aiActivityCompleted ? t("activities.continue") : t("activities.start")}
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </button>
                  {aiCompletionError && (
                    <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                      {aiCompletionError}
                    </p>
                  )}
                </div>
              ) : isInteractive ? (
                <InteractiveActivityRenderer
                  activity={activity}
                  lessonId={lessonId}
                  onSubmissionSaved={onQuizSubmitted}
                  slug={slug}
                />
              ) : hasActivityContent ? (
                <>
                  <div className="mb-2 flex items-center justify-end gap-1.5">
                    <ZoomIn className="h-3.5 w-3.5 text-gray-400 dark:text-white/30" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const currentIndex = ZOOM_STEPS.indexOf(contentZoom);
                        if (currentIndex > 0) setContentZoom(ZOOM_STEPS[currentIndex - 1]);
                      }}
                      disabled={!canZoomOut}
                      title={t("reading.decreaseFontSize")}
                      aria-label={t("reading.decreaseFontSize")}
                      className="rounded px-1.5 py-0.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30 dark:text-white/40 dark:hover:bg-white/10"
                    >
                      A−
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const currentIndex = ZOOM_STEPS.indexOf(contentZoom);
                        if (currentIndex < ZOOM_STEPS.length - 1) setContentZoom(ZOOM_STEPS[currentIndex + 1]);
                      }}
                      disabled={!canZoomIn}
                      title={t("reading.increaseFontSize")}
                      aria-label={t("reading.increaseFontSize")}
                      className="rounded px-1.5 py-0.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30 dark:text-white/40 dark:hover:bg-white/10"
                    >
                      A+
                    </button>
                  </div>
                  <div style={{ zoom: contentZoom }}>
                    <FormattedContentRenderer
                      content={activity.activity_content}
                      activityId={activity.activity_id}
                    />
                  </div>
                </>
              ) : null}
            </div>
          )}

          {activity.activity_type !== "ai_chat" &&
            Boolean(activity.ai_prompts) &&
            !activity.activity_config?.toolTask && (
              <div className="mt-4 border-t border-gray-200 pt-4 dark:border-white/5">
                <div className="mb-3 flex items-center gap-2">
                  <HelpCircle className="h-3.5 w-3.5 text-gray-400 dark:text-white/40" />
                  <span className="text-xs font-medium text-gray-500 dark:text-white/50">
                    {t("activities.promptsAndExercises")}
                  </span>
                </div>
                <PromptsRenderer
                  externalTool={activity.external_tool}
                  prompts={activity.ai_prompts}
                />
              </div>
            )}
        </div>
      )}
    </div>
  );
}
