"use client";

import { QuizIntro } from "./quiz-renderer/QuizIntro";
import { QuizQuestionCard } from "./quiz-renderer/QuizQuestionCard";
import { QuizResultsPanel } from "./quiz-renderer/QuizResultsPanel";
import { QuizSubmitButton } from "./quiz-renderer/QuizSubmitButton";
import { useQuizRendererState } from "./quiz-renderer/useQuizRendererState";
import type { QuizRendererProps } from "./quiz-renderer/quiz-renderer.types";

export function QuizRenderer(props: QuizRendererProps) {
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

  return (
    <div className="space-y-5">
      <QuizIntro
        passingThreshold={passingThreshold}
        totalPoints={props.totalPoints}
        totalQuestions={totalQuestions}
      />

      <div className="space-y-4">
        {normalizedQuizData.map((question, index) => (
          <QuizQuestionCard
            key={question.id}
            index={index}
            onAnswerSelect={handleAnswerSelect}
            question={question}
            selectedAnswer={selectedAnswers[question.id]}
            showResults={showResults}
          />
        ))}
      </div>

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
          onRetry={handleRetry}
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
