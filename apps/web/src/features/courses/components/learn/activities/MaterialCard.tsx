"use client";

import {
  BookText,
  CircleCheck,
  ChevronDown,
  ExternalLink,
  Download,
  FileQuestion,
  ScrollText,
} from "lucide-react";

import styles from "../ActivitiesExperience.module.css";
import { FormattedContentRenderer } from "../ContentRenderers";
import { QuizRenderer } from "../QuizRenderer";
import { MaterialReadingContent } from "./MaterialReadingContent";
import {
  findQuizStatusItem,
  getNormalizedMaterialContent,
  resolveQuizPayload,
} from "./utils";
import type {
  LearnMaterial,
  LessonQuizStatus,
} from "../types";

type MaterialCardProps = {
  isCollapsed: boolean;
  lessonId: string;
  material: LearnMaterial;
  onQuizSubmitted: () => void | Promise<void>;
  onToggle: (materialId: string) => void;
  onRequestQuizFeedback: (
    prompt: string,
    source?: { activityId?: string | null; materialId?: string | null },
  ) => void | Promise<void>;
  quizStatus: LessonQuizStatus | null;
  slug: string;
};

export function MaterialCard({
  isCollapsed,
  lessonId,
  material,
  onQuizSubmitted,
  onToggle,
  onRequestQuizFeedback,
  quizStatus,
  slug,
}: MaterialCardProps) {
  const isQuiz = material.material_type === "quiz";
  const isReading = material.material_type === "reading";
  const normalizedMaterialContent = getNormalizedMaterialContent(material);
  const hasMaterialContent = normalizedMaterialContent.trim().length > 0;
  const shouldShowMaterialCard =
    isQuiz ||
    hasMaterialContent ||
    Boolean(material.external_url || material.file_url);
  const quizInfo = isQuiz
    ? findQuizStatusItem(quizStatus, material.material_id, "material")
    : undefined;

  return (
    <div
      data-material-card-id={material.material_id}
      className={`${styles.activityCard} ${!isCollapsed ? styles.activityCardOpen : ""}`}
    >
      <button
        onClick={(event) => {
          event.stopPropagation();
          onToggle(material.material_id);
        }}
        className={styles.cardButton}
      >
        <div className={styles.cardIcon}>
          {isQuiz ? (
            <FileQuestion />
          ) : isReading ? (
            <BookText />
          ) : (
            <ScrollText />
          )}
        </div>

        <div className={styles.cardCopy}>
          <div className={styles.cardTitleRow}>
            <span className={styles.cardTitle}>
              {material.material_title}
            </span>
            <span className="rounded-full border border-gray-200/70 bg-gray-100/70 px-2 py-1 text-[10px] font-medium capitalize text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-white/45">
              {isReading ? "Lectura" : material.material_type}
            </span>
            {material.is_downloadable && (
              <span className="rounded-full border border-gray-200/70 bg-gray-100/70 px-2 py-1 text-[10px] font-medium text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-white/45">
                Descargable
              </span>
            )}
            {quizInfo?.isPassed && (
              <span className="flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium" style={{ color: 'var(--learn-accent)', borderColor: 'color-mix(in srgb, var(--learn-accent) 20%, transparent)', backgroundColor: 'color-mix(in srgb, var(--learn-accent) 8%, transparent)' }}>
                <CircleCheck className="h-3 w-3" /> Completado
              </span>
            )}
            {quizInfo?.isCompleted && !quizInfo.isPassed && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/10 rounded">
                Intentado {quizInfo.percentage}%
              </span>
            )}
          </div>
        </div>

        <ChevronDown
          className={`${styles.chevron} ${
            !isCollapsed ? styles.chevronOpen : ""
          }`}
        />
      </button>

      {!isCollapsed && (
        <div className={styles.cardBody}>
          {material.material_description && !isReading && (
            <p className={styles.description}>
              {material.material_description}
            </p>
          )}

          {shouldShowMaterialCard && (
            <div className={styles.contentSurface}>
              {(isQuiz || hasMaterialContent) && (
                <div className="w-full">
                  {isQuiz && (() => {
                    const quizPayload = resolveQuizPayload(material.content_data);

                    if (!quizPayload) {
                      return null;
                    }

                    return (
                      <QuizRenderer
                        quizData={quizPayload.questions}
                        totalPoints={quizPayload.totalPoints}
                        quizStatusItem={quizInfo}
                        lessonId={lessonId}
                        slug={slug}
                        materialId={material.material_id}
                        onRequestQuizFeedback={(prompt) => {
                          void onRequestQuizFeedback(prompt, {
                            materialId: material.material_id,
                          });
                        }}
                        onQuizSubmitted={() => {
                          return onQuizSubmitted();
                        }}
                      />
                    );
                  })()}

                  {isReading && (
                    <MaterialReadingContent
                      lessonId={lessonId}
                      material={material}
                      slug={slug}
                    />
                  )}

                  {!isQuiz && !isReading && hasMaterialContent && (
                    <FormattedContentRenderer
                      content={material.content_data}
                      activityId={material.material_id}
                      presentation="editorial"
                    />
                  )}
                </div>
              )}

              {(material.external_url || material.file_url) && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-200/70 pt-3 dark:border-white/10">
                  {material.external_url && (
                    <a
                      href={material.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.quizSecondaryButton}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Abrir enlace
                    </a>
                  )}
                  {material.file_url && (
                    <a
                      href={material.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.quizSecondaryButton}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Ver archivo
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
