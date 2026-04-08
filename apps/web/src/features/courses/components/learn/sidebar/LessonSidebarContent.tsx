"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity as ActivityIcon,
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  LearnActivitySummary,
  LearnMaterialSummary,
  LessonQuizStatus,
  LessonQuizStatusItem,
} from "../types";
import { getQuizStatusItem } from "./utils";

type LessonSidebarContentProps = {
  isExpanded: boolean;
  isContentLoaded: boolean;
  activities: LearnActivitySummary[];
  materials: LearnMaterialSummary[];
  quizStatus: LessonQuizStatus | null | undefined;
};

function QuizStatusBadge({
  quizInfo,
}: {
  quizInfo: LessonQuizStatusItem | null;
}) {
  if (!quizInfo) {
    return null;
  }

  return (
    <div className="mt-2 border-t border-[#E9ECEF]/50 pt-2 dark:border-[#6C757D]/30">
      {quizInfo.isPassed ? (
        <div className="flex items-center gap-1.5 text-xs text-blue-700 dark:text-[#00D4B3]">
          <CheckCircle className="h-3.5 w-3.5" />
          <span className="font-medium">Aprobado ({quizInfo.percentage}%)</span>
        </div>
      ) : quizInfo.isCompleted ? (
        <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
          <X className="h-3.5 w-3.5" />
          <span className="font-medium">Reprobado ({quizInfo.percentage}%)</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
          <Clock className="h-3.5 w-3.5" />
          <span>Pendiente</span>
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="ml-9 mt-3 space-y-2.5 border-l-2 border-blue-200 pl-4 dark:border-[#00D4B3]/40">
        {[1, 2].map((itemIndex) => (
          <div
            key={itemIndex}
            className="animate-pulse rounded-xl border border-[#E9ECEF] bg-white p-3 dark:border-[#6C757D]/30 dark:bg-[#1E2329]"
          >
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 flex-shrink-0 rounded-lg bg-[#E9ECEF] dark:bg-[#1E2329]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-[#E9ECEF] dark:bg-[#1E2329]" />
                <div className="h-3 w-1/4 rounded bg-[#E9ECEF] dark:bg-[#1E2329]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function LessonSidebarContent({
  isExpanded,
  isContentLoaded,
  activities,
  materials,
  quizStatus,
}: LessonSidebarContentProps) {
  const { t } = useTranslation("learn");
  const hasContent = activities.length > 0 || materials.length > 0;

  return (
    <AnimatePresence>
      {isExpanded && !isContentLoaded && <LoadingSkeleton />}

      {isExpanded && isContentLoaded && hasContent && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="ml-9 mt-3 space-y-2.5 border-l-2 border-blue-200 pl-4 dark:border-[#00D4B3]/40">
            {activities.length > 0 && (
              <div className="space-y-2">
                {activities.map((activity) => {
                  const isQuiz = activity.activity_type === "quiz";
                  const quizInfo = isQuiz
                    ? getQuizStatusItem(quizStatus, activity.activity_id, "activity")
                    : null;

                  return (
                    <div
                      key={activity.activity_id}
                      className="group relative rounded-2xl p-3 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 shadow-sm transition-colors group-hover:border-gray-300 dark:border-white/10 dark:bg-[#0F1419] dark:group-hover:border-white/20">
                          {isQuiz ? (
                            <FileText className="h-5 w-5 text-blue-700 dark:text-[#00D4B3]" />
                          ) : (
                            <ActivityIcon className="h-5 w-5 text-blue-700 dark:text-[#00D4B3]" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="mb-2 text-sm font-medium leading-tight text-gray-900 dark:text-white">
                            {activity.activity_title}
                          </p>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:border-[#00D4B3]/30 dark:bg-[#0F1419] dark:text-[#00D4B3]">
                              {activity.activity_type}
                            </span>

                            {activity.is_required && (
                              <span className="rounded-full border border-red-300 bg-red-100 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                                {t("activities.required")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isQuiz && <QuizStatusBadge quizInfo={quizInfo} />}
                    </div>
                  );
                })}
              </div>
            )}

            {materials.length > 0 && (
              <div className="space-y-2">
                {materials.map((material) => {
                  const isQuiz = material.material_type === "quiz";
                  const isReading = material.material_type === "reading";
                  const quizInfo = isQuiz
                    ? getQuizStatusItem(quizStatus, material.material_id, "material")
                    : null;

                  return (
                    <div
                      key={material.material_id}
                      className="group relative rounded-2xl p-3 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 shadow-sm transition-colors group-hover:border-gray-300 dark:border-white/10 dark:bg-[#0F1419] dark:group-hover:border-white/20">
                          {isReading ? (
                            <BookOpen className="h-5 w-5 text-blue-700 dark:text-[#00D4B3]" />
                          ) : (
                            <FileText className="h-5 w-5 text-blue-700 dark:text-[#00D4B3]" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="mb-2 text-sm font-medium leading-tight text-gray-900 dark:text-white">
                            {material.material_title}
                          </p>

                          <div className="flex flex-wrap items-center gap-2">
                            {material.is_required && (
                              <span className="rounded-full border border-red-300 bg-red-100 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                                Requerida
                              </span>
                            )}

                            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:border-[#00D4B3]/30 dark:bg-[#0F1419] dark:text-[#00D4B3]">
                              {material.material_type}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isQuiz && <QuizStatusBadge quizInfo={quizInfo} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
