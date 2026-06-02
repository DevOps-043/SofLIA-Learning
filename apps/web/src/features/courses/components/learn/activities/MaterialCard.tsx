"use client";

import {
  BookOpen,
  Check,
  ChevronDown,
  ExternalLink,
  FileDown,
  FileText,
  ScrollText,
} from "lucide-react";

import {
  FormattedContentRenderer,
  ReadingContentRenderer,
} from "../ContentRenderers";
import { QuizRenderer } from "../QuizRenderer";
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
      className="scroll-mt-6 rounded-lg border border-gray-200 dark:border-white/5 bg-white dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors shadow-sm dark:shadow-none"
    >
      <button
        onClick={(event) => {
          event.stopPropagation();
          onToggle(material.material_id);
        }}
        className="w-full px-4 py-3 flex items-center gap-3"
      >
        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
          {isQuiz ? (
            <FileText className="w-4 h-4 text-gray-500 dark:text-white/60" />
          ) : isReading ? (
            <BookOpen className="w-4 h-4 text-gray-500 dark:text-white/60" />
          ) : (
            <ScrollText className="w-4 h-4 text-gray-500 dark:text-white/60" />
          )}
        </div>

        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {material.material_title}
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:text-white/40 bg-gray-100 dark:bg-white/5 rounded capitalize">
              {isReading ? "Lectura" : material.material_type}
            </span>
            {material.is_downloadable && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-white/40 bg-blue-100 dark:bg-white/5 rounded">
                Descargable
              </span>
            )}
            {quizInfo?.isPassed && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium text-primary dark:text-accent bg-primary/10 dark:bg-accent/15 rounded flex items-center gap-1">
                <Check className="w-2.5 h-2.5" /> Completado
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
          className={`w-4 h-4 text-gray-400 dark:text-white/30 transition-transform ${
            !isCollapsed ? "rotate-180" : ""
          }`}
        />
      </button>

      {!isCollapsed && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-white/5">
          {material.material_description && !isReading && (
            <p className="text-gray-500 dark:text-white/40 text-xs mt-3 mb-3 leading-relaxed">
              {material.material_description}
            </p>
          )}

          {shouldShowMaterialCard && (
            <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 p-3">
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
                    <ReadingContentRenderer
                      audioSource={{
                        sourceKind: "material_reading",
                        sourceId: material.material_id,
                      }}
                      content={
                        material.content_data || material.material_description
                      }
                    />
                  )}

                  {!isQuiz && !isReading && hasMaterialContent && (
                    <FormattedContentRenderer
                      content={material.content_data}
                      activityId={material.material_id}
                    />
                  )}
                </div>
              )}

              {(material.external_url || material.file_url) && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-white/5">
                  {material.external_url && (
                    <a
                      href={material.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white/80 transition-colors"
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
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-xs font-medium text-gray-600 dark:text-white/70 transition-colors"
                    >
                      <FileDown className="w-3.5 h-3.5" />
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
