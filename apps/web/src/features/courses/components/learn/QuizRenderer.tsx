"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { buildQuizFeedbackPrompt } from "./quiz.utils";
import { QuizIntro } from "./quiz-renderer/QuizIntro";
import { QuizQuestionNavigator } from "./quiz-renderer/QuizQuestionNavigator";
import { QuizQuestionCard } from "./quiz-renderer/QuizQuestionCard";
import { QuizResultsPanel } from "./quiz-renderer/QuizResultsPanel";
import { QuizSubmitButton } from "./quiz-renderer/QuizSubmitButton";
import { useQuizRendererState } from "./quiz-renderer/useQuizRendererState";
import type { QuizRendererProps } from "./quiz-renderer/quiz-renderer.types";

export function QuizRenderer(props: QuizRendererProps) {
  const { t } = useTranslation("learn");
  const {
    handleAnswerSelect,
    handleRetry,
    handleSubmit,
    isSubmitting,
    normalizedQuizData,
    passed,
    passingThreshold,
    percentage,
    pointsEarned,
    score,
    selectedAnswers,
    serverMessage,
    showResults,
    submitError,
    totalQuestions,
  } = useQuizRendererState(props);
  const feedbackPrompt = useMemo(
    () => buildQuizFeedbackPrompt(normalizedQuizData, selectedAnswers),
    [normalizedQuizData, selectedAnswers],
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const answeredQuestionCount = Object.keys(selectedAnswers).length;
  const currentQuestion = normalizedQuizData[currentQuestionIndex];

  useEffect(() => {
    setCurrentQuestionIndex(0);
  }, [normalizedQuizData]);

  const handleRetryQuiz = () => {
    setCurrentQuestionIndex(0);
    handleRetry();
  };

  if (totalQuestions === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
        {t("activities.quiz.empty")}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <QuizIntro
        passingThreshold={passingThreshold}
        totalPoints={props.totalPoints}
        totalQuestions={totalQuestions}
      />

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-white/50">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span>
            {t("activities.quiz.questionProgress", {
              current: currentQuestionIndex + 1,
              total: totalQuestions,
            })}
          </span>
          <QuizQuestionNavigator
            currentQuestionIndex={currentQuestionIndex}
            onQuestionChange={setCurrentQuestionIndex}
            questions={normalizedQuizData}
            selectedAnswers={selectedAnswers}
            showResults={showResults}
          />
        </div>
        <span>
          {t("activities.quiz.answered", {
            answered: answeredQuestionCount,
            total: totalQuestions,
          })}
        </span>
      </div>

      <div className="space-y-4">
        {currentQuestion && (
          <QuizQuestionCard
            key={currentQuestion.id}
            index={currentQuestionIndex}
            onAnswerSelect={handleAnswerSelect}
            question={currentQuestion}
            selectedAnswer={selectedAnswers[currentQuestion.id]}
            showResults={showResults}
          />
        )}
      </div>

      {totalQuestions > 1 && !showResults && (
        <div className="flex items-center justify-between gap-3">
          <button
            className="rounded-md bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))}
            type="button"
          >
            {t("activities.quiz.previous")}
          </button>
          <button
            className="rounded-md bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
            disabled={currentQuestionIndex >= totalQuestions - 1}
            onClick={() =>
              setCurrentQuestionIndex((index) =>
                Math.min(totalQuestions - 1, index + 1),
              )
            }
            type="button"
          >
            {t("activities.quiz.next")}
          </button>
        </div>
      )}

      {submitError && (
        <div className="px-3 py-2 rounded-md bg-red-500/10 border border-red-500/20">
          <p className="text-red-400 text-xs">{submitError}</p>
        </div>
      )}

      {!showResults && (
        <QuizSubmitButton
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          selectedAnswerCount={Object.keys(selectedAnswers).length}
          totalQuestions={totalQuestions}
        />
      )}

      {showResults && (
        <QuizResultsPanel
          onRetry={handleRetryQuiz}
          onRequestFeedback={
            feedbackPrompt && props.onRequestQuizFeedback
              ? () => props.onRequestQuizFeedback?.(feedbackPrompt, {
                  activityId: props.activityId,
                  materialId: props.materialId,
                })
              : undefined
          }
          passed={passed}
          passingThreshold={passingThreshold}
          percentage={percentage}
          pointsEarned={pointsEarned}
          score={score}
          serverMessage={serverMessage}
          totalPoints={props.totalPoints}
          totalQuestions={totalQuestions}
        />
      )}
    </div>
  );
}
