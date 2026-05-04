"use client";

import { useCallback, useEffect } from "react";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Info,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { useLiaCourse } from "../../context/LiaCourseContext";
import { ActivityCard } from "./activities/ActivityCard";
import { MaterialCard } from "./activities/MaterialCard";
import { useActivitiesData } from "./activities/useActivitiesData";
import { extractPromptList } from "./activities/utils";
import type {
  GenerateRoleBasedPrompts,
  LearnActivity,
  LearnLesson,
} from "./types";

type ActivitiesContentProps = {
  hasNextLesson?: boolean;
  lesson: LearnLesson;
  onCompleteCourse?: () => void | Promise<void>;
  onLessonContentRefresh?: (
    lessonId: string,
    forceRefresh?: boolean
  ) => void | Promise<void>;
  onNavigateNext?: () => void | Promise<void>;
  onPromptsChange?: (prompts: string[]) => void;
  selectedLang: string;
  slug: string;
  userRole?: string;
  generateRoleBasedPrompts?: GenerateRoleBasedPrompts;
  focusedActivityId?: string | null;
  focusedMaterialId?: string | null;
  onActivityFocused?: () => void;
};

function getCssEscapedIdentifier(value: string) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }

  return value.replace(/["\\]/g, "\\$&");
}

export function ActivitiesContent({
  hasNextLesson,
  lesson,
  onCompleteCourse,
  onLessonContentRefresh,
  onNavigateNext,
  onPromptsChange,
  selectedLang,
  slug,
  userRole,
  generateRoleBasedPrompts,
  focusedActivityId,
  focusedMaterialId,
  onActivityFocused,
}: ActivitiesContentProps) {
  const { t } = useTranslation("learn");
  const { setActivity, openLia, isOpen: isLiaOpen, liaChat, courseContext } =
    useLiaCourse();

  const sendLiaMessage = useCallback(
    async (message: string, isSystemMessage: boolean = false) => {
      if (!liaChat?.sendMessage) {
        return;
      }

      if (!isLiaOpen) {
        openLia();
      }

      await liaChat.sendMessage(
        message,
        courseContext || undefined,
        undefined,
        isSystemMessage
      );
    },
    [courseContext, isLiaOpen, liaChat, openLia]
  );

  const {
    activities,
    collapsedActivities,
    collapsedMaterials,
    feedbackLoading,
    handleLessonFeedback,
    isRefreshing,
    lessonFeedback,
    loading,
    materials,
    quizStatus,
    refreshLessonContent,
    focusActivityOnly,
    focusMaterialOnly,
    toggleActivityCollapse,
    toggleMaterialCollapse,
  } = useActivitiesData({
    lessonId: lesson.lesson_id,
    slug,
    selectedLang,
    onPromptsChange,
    userRole,
    generateRoleBasedPrompts,
    onLessonContentRefresh,
  });

  useEffect(() => {
    if ((!focusedActivityId && !focusedMaterialId) || loading) {
      return;
    }

    const target = focusedActivityId
      ? { id: focusedActivityId, type: "activity" as const }
      : focusedMaterialId
        ? { id: focusedMaterialId, type: "material" as const }
        : null;

    if (!target) {
      return;
    }

    const activityIds = activities.map((activity) => activity.activity_id);
    const materialIds = materials.map((material) => material.material_id);
    const hasTargetActivity =
      target.type === "activity" && activityIds.includes(target.id);
    const hasTargetMaterial =
      target.type === "material" && materialIds.includes(target.id);

    if (!hasTargetActivity && !hasTargetMaterial) {
      return;
    }

    if (hasTargetActivity) {
      focusActivityOnly(target.id, activityIds);
    } else {
      focusMaterialOnly(target.id, materialIds);
    }

    const animationFrame = window.requestAnimationFrame(() => {
      const attributeName =
        target.type === "activity"
          ? "data-activity-card-id"
          : "data-material-card-id";
      const targetElement = document.querySelector(
        `[${attributeName}="${getCssEscapedIdentifier(target.id)}"]`
      );

      targetElement?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      onActivityFocused?.();
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [
    activities,
    focusActivityOnly,
    focusMaterialOnly,
    focusedActivityId,
    focusedMaterialId,
    loading,
    materials,
    onActivityFocused,
  ]);

  const handleStartAiChat = useCallback(
    (activity: LearnActivity) => {
      setActivity({
        id: activity.activity_id,
        title: activity.activity_title,
        type: activity.activity_type,
        description: activity.activity_description || "",
        prompts: extractPromptList(activity.ai_prompts),
        timestamp: Date.now(),
      });
      openLia();
    },
    [openLia, setActivity]
  );

  const hasActivities = activities.length > 0;
  const hasMaterials = materials.length > 0;
  const hasContent = hasActivities || hasMaterials;

  if (loading) {
    return (
      <div className="space-y-6 pb-24 md:pb-6">
        <div>
          <h2
            className="text-2xl font-bold text-[#0A2540] dark:text-white mb-2"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
          >
            {t("activities.title")}
          </h2>
          <p
            className="text-[#6C757D] dark:text-white/80 text-sm"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
          >
            {lesson.lesson_title}
          </p>
        </div>
        <div className="bg-white dark:bg-[#1E2329] rounded-xl border-2 border-[#E9ECEF] dark:border-[#6C757D]/30 p-8 text-center">
          <div className="w-16 h-16 bg-[#0A2540]/10 dark:bg-[#00D4B3]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-[#0A2540] dark:text-[#00D4B3] animate-pulse" />
          </div>
          <p
            className="text-[#6C757D] dark:text-white/80"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
          >
            {t("loading.activities")}
          </p>
        </div>
      </div>
    );
  }

  if (!hasContent) {
    return (
      <div className="space-y-6 pb-24 md:pb-6">
        <div>
          <h2
            className="text-2xl font-bold text-[#0A2540] dark:text-white mb-2"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
          >
            {t("activities.title")}
          </h2>
          <p
            className="text-[#6C757D] dark:text-white/80 text-sm"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
          >
            {lesson.lesson_title}
          </p>
        </div>

        <div className="bg-white dark:bg-[#1E2329] rounded-xl border-2 border-[#E9ECEF] dark:border-[#6C757D]/30 p-8 text-center">
          <div className="w-16 h-16 bg-[#0A2540]/10 dark:bg-[#00D4B3]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-[#0A2540] dark:text-[#00D4B3]" />
          </div>
          <h3
            className="text-[#0A2540] dark:text-white text-lg font-semibold mb-2"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 600 }}
          >
            {t("activities.notAvailable")}
          </h3>
          <p
            className="text-[#6C757D] dark:text-white/80 mb-4"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
          >
            {t("activities.notAvailableMessage")}
          </p>
          <div
            className="text-sm text-[#6C757D] dark:text-white/60"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
          >
            <p>• {t("activities.tips.manual")}</p>
            <p>• {t("activities.tips.contactInstructor")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="pb-4 border-b border-gray-200 dark:border-white/5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t("activities.title")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-white/40 mt-1">
              {lesson.lesson_title}
            </p>
          </div>
          {isRefreshing && (
            <span className="text-xs font-medium text-gray-500 dark:text-white/50">
              {t("activities.updatingProgress")}
            </span>
          )}
        </div>
      </div>

      {hasActivities && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-white/5 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-gray-500 dark:text-white/50" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-white/70">
              {t("activities.title")}
            </span>
            <span className="text-xs text-gray-500 dark:text-white/30">
              {activities.length}
            </span>
          </div>

          <div className="space-y-2">
            {activities.map((activity) => (
              <ActivityCard
                key={activity.activity_id}
                activity={activity}
                isCollapsed={collapsedActivities.has(activity.activity_id)}
                lessonId={lesson.lesson_id}
                onQuizSubmitted={refreshLessonContent}
                onStartAiChat={handleStartAiChat}
                onToggle={toggleActivityCollapse}
                onTriggerLiaFeedback={(prompt) => sendLiaMessage(prompt, true)}
                quizStatus={quizStatus}
                slug={slug}
              />
            ))}
          </div>
        </div>
      )}

      {hasMaterials && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-white/5 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-gray-500 dark:text-white/50" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-white/70">
              {t("activities.materials")}
            </span>
            <span className="text-xs text-gray-500 dark:text-white/30">
              {materials.length}
            </span>
          </div>

          <div className="space-y-2">
            {materials.map((material) => (
              <MaterialCard
                key={material.material_id}
                isCollapsed={collapsedMaterials.has(material.material_id)}
                lessonId={lesson.lesson_id}
                material={material}
                onQuizSubmitted={refreshLessonContent}
                onToggle={toggleMaterialCollapse}
                onTriggerLiaFeedback={(prompt) => sendLiaMessage(prompt, true)}
                quizStatus={quizStatus}
                slug={slug}
              />
            ))}
          </div>
        </div>
      )}

      {(hasActivities || hasMaterials) && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5">
          <Info className="w-4 h-4 text-gray-400 dark:text-white/30 flex-shrink-0" />
          <p className="text-xs text-gray-500 dark:text-white/40 leading-relaxed">
            {t("activities.completionRequirement")}
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-4 border-t border-gray-200 dark:border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 dark:text-white/40">
            {t("activities.feedback.useful")}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                void handleLessonFeedback("like");
              }}
              disabled={feedbackLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                lessonFeedback === "like"
                  ? "bg-[#0A2540]/10 dark:bg-[#00D4B3]/15 text-[#0A2540] dark:text-[#00D4B3]"
                  : "text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-white/70"
              } ${feedbackLoading ? "opacity-50" : ""}`}
            >
              <ThumbsUp
                className={`w-3.5 h-3.5 ${
                  lessonFeedback === "like" ? "fill-current" : ""
                }`}
              />
              {t("activities.feedback.yes")}
            </button>
            <button
              onClick={() => {
                void handleLessonFeedback("dislike");
              }}
              disabled={feedbackLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                lessonFeedback === "dislike"
                  ? "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                  : "text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-white/70"
              } ${feedbackLoading ? "opacity-50" : ""}`}
            >
              <ThumbsDown
                className={`w-3.5 h-3.5 ${
                  lessonFeedback === "dislike" ? "fill-current" : ""
                }`}
              />
              {t("activities.feedback.no")}
            </button>
          </div>
        </div>

        {hasNextLesson && onNavigateNext && (
          <button
            onClick={onNavigateNext}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#0A2540] hover:bg-[#0d2f4d] dark:bg-[#00D4B3] dark:hover:bg-[#00b89a] text-white dark:text-[#0A1724] transition-colors"
          >
            {t("navigation.nextVideo")}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        {!hasNextLesson && onCompleteCourse && (
          <button
            onClick={onCompleteCourse}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#0A2540] hover:bg-[#0d2f4d] dark:bg-[#00D4B3] dark:hover:bg-[#00b89a] text-white dark:text-[#0A1724] transition-colors"
          >
            {t("navigation.finishCourse")}
            <CheckCircle2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
