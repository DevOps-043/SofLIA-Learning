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
import {
  findQuizStatusItem,
  getNormalizedActivityContent,
  resolveQuizPayload,
} from "./utils";
import type {
  LearnActivity,
  LessonQuizStatus,
} from "../types";

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
      : "text-yellow-600 dark:text-yellow-400";

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <p className={`${colorClasses} mb-2`}>{message}</p>
      <div
        className="text-[#0A2540] dark:text-white leading-relaxed whitespace-pre-wrap"
        style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
      >
        {typeof rawContent === "string"
          ? rawContent
          : JSON.stringify(rawContent, null, 2)}
      </div>
    </div>
  );
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
  const normalizedActivityContent = getNormalizedActivityContent(activity);
  const hasActivityContent = normalizedActivityContent.trim().length > 0;
  const shouldShowActivityCard = isQuiz || isAiChat || hasActivityContent;
  const quizInfo = isQuiz
    ? findQuizStatusItem(quizStatus, activity.activity_id, "activity")
    : undefined;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-white/5 bg-white dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors shadow-sm dark:shadow-none">
      <button
        onClick={(event) => {
          event.stopPropagation();
          onToggle(activity.activity_id);
        }}
        className="w-full px-4 py-3 flex items-center gap-3"
      >
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isAiChat ? "bg-indigo-50 dark:bg-white/10" : "bg-gray-100 dark:bg-white/5"
          }`}
        >
          {isAiChat ? (
            <MessageCircle className="w-4 h-4 text-indigo-500 dark:text-white/60" />
          ) : isQuiz ? (
            <FileText className="w-4 h-4 text-gray-500 dark:text-white/60" />
          ) : (
            <Activity className="w-4 h-4 text-gray-500 dark:text-white/60" />
          )}
        </div>

        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {activity.activity_title}
            </span>
            {activity.is_required && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400/80 bg-amber-100 dark:bg-amber-500/10 rounded">
                Requerida
              </span>
            )}
            <span className="px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:text-white/40 bg-gray-100 dark:bg-white/5 rounded capitalize">
              {isAiChat ? "Chat IA" : activity.activity_type}
            </span>
            {activity.is_required && quizInfo?.isPassed && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400/80 bg-emerald-100 dark:bg-emerald-500/10 rounded flex items-center gap-1">
                <Check className="w-2.5 h-2.5" /> Completado
              </span>
            )}
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-gray-400 dark:text-white/30 transition-transform ${
            !isCollapsed ? "rotate-180" : ""
          }`}
        />
      </button>

      {!isCollapsed && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-white/5">
          {activity.activity_description && (
            <p className="text-gray-500 dark:text-white/40 text-xs mt-3 mb-3 leading-relaxed">
              {activity.activity_description}
            </p>
          )}

          {shouldShowActivityCard && (
            <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 p-3">
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
                  <div className="w-10 h-10 mx-auto rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
                    <MessageCircle className="w-5 h-5 text-gray-500 dark:text-white/50" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Actividad con LIA
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-white/40 mb-4">
                    Inicia una conversación guiada para completar esta actividad
                  </p>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onStartAiChat(activity);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#0A2540] hover:bg-[#0d2f4d] text-white transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    Comenzar
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>
                </div>
              ) : (
                hasActivityContent && (
                  <FormattedContentRenderer
                    content={activity.activity_content}
                    activityId={activity.activity_id}
                  />
                )
              )}
            </div>
          )}

          {activity.activity_type !== "ai_chat" &&
            Boolean(activity.ai_prompts) && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-3.5 h-3.5 text-gray-400 dark:text-white/40" />
                <span className="text-gray-500 dark:text-white/50 text-xs font-medium">
                  Prompts y Ejercicios
                </span>
              </div>
              <PromptsRenderer prompts={activity.ai_prompts} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
