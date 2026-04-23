"use client";

import { useCurrentOrganizationId } from "@/core/stores/organizationStore";

import { QuizIntro } from "./quiz-renderer/QuizIntro";
import { QuizQuestionsList } from "./quiz-renderer/QuizQuestionsList";
import { QuizResultsPanel } from "./quiz-renderer/QuizResultsPanel";
import { QuizSubmitActions } from "./quiz-renderer/QuizSubmitActions";
import { QuizSubmitError } from "./quiz-renderer/QuizSubmitError";
import type { QuizRendererProps } from "./quiz-renderer/QuizRenderer.types";
import { useQuizRendererState } from "./quiz-renderer/useQuizRendererState";
import { useQuizSubmission } from "./quiz-renderer/useQuizSubmission";

export function QuizRenderer(props: QuizRendererProps) {
  const organizationId = useCurrentOrganizationId();
  const state = useQuizRendererState({
    quizData: props.quizData,
    quizStatusItem: props.quizStatusItem,
  });
  const actions = useQuizSubmission({
    activityId: props.activityId,
    lessonId: props.lessonId,
    materialId: props.materialId,
    normalizedQuizData: state.normalizedQuizData,
    onQuizSubmitted: props.onQuizSubmitted,
    onTriggerLiaFeedback: props.onTriggerLiaFeedback,
    organizationId,
    selectedAnswers: state.selectedAnswers,
    setIsSubmitting: state.setIsSubmitting,
    setPointsEarned: state.setPointsEarned,
    setScore: state.setScore,
    setSelectedAnswers: state.setSelectedAnswers,
    setServerMessage: state.setServerMessage,
    setShowResults: state.setShowResults,
    setSubmitError: state.setSubmitError,
    slug: props.slug,
    totalPoints: props.totalPoints,
  });

  return (
    <div className="space-y-5">
      <QuizIntro
        passingThreshold={state.passingThreshold}
        totalPoints={props.totalPoints}
        totalQuestions={state.totalQuestions}
      />
      <QuizQuestionsList
        normalizedQuizData={state.normalizedQuizData}
        onAnswerSelect={actions.handleAnswerSelect}
        selectedAnswers={state.selectedAnswers}
        showResults={state.showResults}
      />
      <QuizSubmitError submitError={state.submitError} />
      <QuizSubmitActions
        isSubmitting={state.isSubmitting}
        onSubmit={actions.handleSubmit}
        selectedAnswers={state.selectedAnswers}
        showResults={state.showResults}
        totalQuestions={state.totalQuestions}
      />
      <QuizResultsPanel
        onRetry={actions.handleRetry}
        passed={state.passed}
        passingThreshold={state.passingThreshold}
        percentage={state.percentage}
        pointsEarned={state.pointsEarned}
        score={state.score}
        serverMessage={state.serverMessage}
        showResults={state.showResults}
        totalPoints={props.totalPoints}
        totalQuestions={state.totalQuestions}
      />
    </div>
  );
}
