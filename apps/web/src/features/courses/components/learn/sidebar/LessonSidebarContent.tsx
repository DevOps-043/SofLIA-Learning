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
import styles from "./CourseSidebar.module.css";
import { getQuizStatusItem } from "./utils";

type LessonSidebarContentProps = {
  isExpanded: boolean;
  isContentLoaded: boolean;
  activities: LearnActivitySummary[];
  materials: LearnMaterialSummary[];
  quizStatus: LessonQuizStatus | null | undefined;
  onSelectActivity: (activityId: string) => void | Promise<void>;
  onSelectMaterial: (materialId: string) => void | Promise<void>;
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
    <>
      {quizInfo.isPassed ? (
        <div className={`${styles.quizStatus} ${styles.quizStatusPassed}`}>
          <CheckCircle aria-hidden="true" />
          <span>Aprobado ({quizInfo.percentage}%)</span>
        </div>
      ) : quizInfo.isCompleted ? (
        <div className={`${styles.quizStatus} ${styles.quizStatusFailed}`}>
          <X aria-hidden="true" />
          <span>Reprobado ({quizInfo.percentage}%)</span>
        </div>
      ) : (
        <div className={styles.quizStatus}>
          <Clock aria-hidden="true" />
          <span>Pendiente</span>
        </div>
      )}
    </>
  );
}

function LoadingSkeleton() {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={styles.lessonSkeleton}
    >
      <div className={styles.lessonContentInner}>
        {[1, 2].map((itemIndex) => (
          <div
            key={itemIndex}
            className={`${styles.skeletonCard} animate-pulse`}
          >
            <span className={styles.skeletonIcon} />
            <div className={styles.skeletonLines}>
              <span />
              <span />
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
  onSelectActivity,
  onSelectMaterial,
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
          className={styles.lessonContent}
        >
          <div className={styles.lessonContentInner}>
            {activities.length > 0 && (
              <>
                {activities.map((activity) => {
                  const isQuiz = activity.activity_type === "quiz";
                  const quizInfo = isQuiz
                    ? getQuizStatusItem(quizStatus, activity.activity_id, "activity")
                    : null;

                  return (
                    <button
                      type="button"
                      key={activity.activity_id}
                      onClick={() => {
                        void onSelectActivity(activity.activity_id);
                      }}
                      className={styles.lessonItem}
                    >
                      <div className={styles.lessonItemMain}>
                        <div className={styles.lessonItemIcon}>
                          {isQuiz ? (
                            <FileText aria-hidden="true" />
                          ) : (
                            <ActivityIcon aria-hidden="true" />
                          )}
                        </div>

                        <div className={styles.lessonItemBody}>
                          <p className={styles.lessonItemTitle}>
                            {activity.activity_title}
                          </p>

                          <div className={styles.lessonItemMeta}>
                            <span className={styles.metaBadge}>
                              {activity.activity_type}
                            </span>

                            {activity.is_required && (
                              <span className={styles.requiredBadge}>
                                {t("activities.required")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isQuiz && <QuizStatusBadge quizInfo={quizInfo} />}
                    </button>
                  );
                })}
              </>
            )}

            {materials.length > 0 && (
              <>
                {materials.map((material) => {
                  const isQuiz = material.material_type === "quiz";
                  const isReading = material.material_type === "reading";
                  const quizInfo = isQuiz
                    ? getQuizStatusItem(quizStatus, material.material_id, "material")
                    : null;

                  return (
                    <button
                      type="button"
                      key={material.material_id}
                      onClick={() => {
                        void onSelectMaterial(material.material_id);
                      }}
                      className={styles.lessonItem}
                    >
                      <div className={styles.lessonItemMain}>
                        <div className={styles.lessonItemIcon}>
                          {isReading ? (
                            <BookOpen aria-hidden="true" />
                          ) : (
                            <FileText aria-hidden="true" />
                          )}
                        </div>

                        <div className={styles.lessonItemBody}>
                          <p className={styles.lessonItemTitle}>
                            {material.material_title}
                          </p>

                          <div className={styles.lessonItemMeta}>
                            {material.is_required && (
                              <span className={styles.requiredBadge}>
                                Requerida
                              </span>
                            )}

                            <span className={styles.metaBadge}>
                              {material.material_type}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isQuiz && <QuizStatusBadge quizInfo={quizInfo} />}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
