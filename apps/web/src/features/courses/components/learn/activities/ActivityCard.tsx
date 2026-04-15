"use client";

import {
  Activity,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  HelpCircle,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import { FormattedContentRenderer, PromptsRenderer } from "../ContentRenderers";
import { QuizRenderer } from "../QuizRenderer";
import { InteractiveActivityRenderer } from "./InteractiveActivityRenderer";
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
  onStartAiChat: (activity: LearnActivity) => void;
  onToggle: (activityId: string) => void;
  onTriggerLiaFeedback: (prompt: string) => void | Promise<void>;
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
        className="whitespace-pre-wrap text-[#0A2540] dark:text-white"
        style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
      >
        {typeof rawContent === "string"
          ? rawContent
          : JSON.stringify(rawContent, null, 2)}
      </div>
    </div>
  );
}

function CompletionBadge({ activity }: { activity: LearnActivity }) {
  if (activity.activity_type === "quiz") {
    return null;
  }

  if (activity.latest_submission_summary?.completionSatisfied) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
        <Check className="h-2.5 w-2.5" /> Completado
      </span>
    );
  }

  if (activity.latest_submission_summary?.status === "needs_revision") {
    return (
      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
        Requiere revision
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
  onTriggerLiaFeedback,
  quizStatus,
  slug,
}: ActivityCardProps) {
  const isAiChat = activity.activity_type === "ai_chat";
  const isQuiz = activity.activity_type === "quiz";
  const isInteractive = Boolean(activity.activity_config);
  const normalizedActivityContent = getNormalizedActivityContent(activity);
  const hasActivityContent = normalizedActivityContent.trim().length > 0;
  const shouldShowActivityCard =
    isQuiz || isAiChat || isInteractive || hasActivityContent;
  const quizInfo = isQuiz
    ? findQuizStatusItem(quizStatus, activity.activity_id, "activity")
    : undefined;

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm transition-colors hover:bg-gray-50 dark:border-white/5 dark:bg-white/[0.02] dark:shadow-none dark:hover:bg-white/[0.04]">
      <button
        onClick={(event) => {
          event.stopPropagation();
          onToggle(activity.activity_id);
        }}
        className="flex w-full items-center gap-3 px-4 py-3"
      >
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
            isAiChat
              ? "bg-indigo-50 dark:bg-white/10"
              : "bg-gray-100 dark:bg-white/5"
          }`}
        >
          {isAiChat ? (
            <MessageCircle className="h-4 w-4 text-indigo-500 dark:text-white/60" />
          ) : isQuiz ? (
            <FileText className="h-4 w-4 text-gray-500 dark:text-white/60" />
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
                Requerida
              </span>
            )}
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium capitalize text-gray-500 dark:bg-white/5 dark:text-white/40">
              {isAiChat ? "Chat IA" : activity.activity_type}
            </span>
            {activity.is_required && quizInfo?.isPassed && (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                <Check className="h-2.5 w-2.5" /> Completado
              </span>
            )}
            {activity.is_required &&
              quizInfo?.isCompleted &&
              !quizInfo.isPassed && (
                <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  Intentado {quizInfo.percentage}%
                </span>
              )}
            <CompletionBadge activity={activity} />
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
                      message="Error: El quiz no tiene la estructura esperada"
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
                    onTriggerLiaFeedback={(prompt) => {
                      void onTriggerLiaFeedback(prompt);
                    }}
                    onQuizSubmitted={() => {
                      void onQuizSubmitted();
                    }}
                  />
                );
              })()}

              {isAiChat ? (
                <div className="p-4 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/5">
                    <MessageCircle className="h-5 w-5 text-gray-500 dark:text-white/50" />
                  </div>
                  <h4 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
                    Actividad con LIA
                  </h4>
                  <p className="mb-4 text-xs text-gray-500 dark:text-white/40">
                    Inicia una conversación guiada para completar esta actividad
                  </p>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onStartAiChat(activity);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#0A2540] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0d2f4d] dark:bg-[#00D4B3] dark:text-[#0A1724] dark:hover:bg-[#00b89a]"
                  >
                    <Sparkles className="h-4 w-4" />
                    Comenzar
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </button>
                </div>
              ) : isInteractive ? (
                <InteractiveActivityRenderer
                  activity={activity}
                  lessonId={lessonId}
                  onSubmissionSaved={onQuizSubmitted}
                  slug={slug}
                />
              ) : hasActivityContent ? (
                <FormattedContentRenderer
                  content={activity.activity_content}
                  activityId={activity.activity_id}
                />
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
                    Prompts y ejercicios
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
