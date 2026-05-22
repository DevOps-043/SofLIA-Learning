"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { useCurrentOrganizationId } from "@/core/stores/organizationStore";
import {
  buildQuizFeedbackPrompt,
  calculateQuizResults,
  isQuizAnswerCorrect,
  mapAnswerIndexesToOptionText,
  normalizeQuizQuestions,
  parseQuizExplanation,
  shuffleQuizQuestions,
  type QuizQuestion,
  type SelectedQuizAnswers,
} from "@/features/courses/components/learn/quiz.utils";
import type { LessonQuizStatusItem } from "@/features/courses/components/learn/types";
import type { QuizSubmissionAnswers } from "@/features/courses/services/quiz-submission.service";
import { cn } from "@/shared/utils/cn";

const PASSING_THRESHOLD = 80;

type QuizRendererProps = {
  quizData: QuizQuestion[];
  totalPoints?: number;
  quizStatusItem?: LessonQuizStatusItem;
  lessonId?: string;
  slug?: string;
  materialId?: string;
  activityId?: string;
  onRequestQuizFeedback?: (prompt: string) => void;
  onQuizSubmitted?: () => void;
};

type HydratedQuizState = {
  bestScore: number | null;
  hydratedSubmissionKey: string | null;
  pointsEarned: number;
  score: number;
  selectedAnswers: SelectedQuizAnswers;
  showResults: boolean;
};

type SubmitQuizResultsParams = {
  activityId?: string;
  lessonId: string;
  materialId?: string;
  normalizedQuizData: QuizQuestion[];
  organizationId?: string | null;
  onQuizSubmitted?: () => void;
  selectedAnswers: SelectedQuizAnswers;
  saveErrorMessage: string;
  setBestScore: (score: number | null) => void;
  setServerMessage: (message: string | null) => void;
  setSubmitError: (error: string | null) => void;
  slug: string;
  totalPoints?: number;
};

type QuizSubmitResponse = {
  error?: string;
  message?: string;
  result?: {
    bestScore?: number;
    submission?: {
      submission_id?: string;
    };
  };
};

function toSelectedQuizAnswers(
  normalizedQuizData: QuizQuestion[],
  userAnswers: QuizSubmissionAnswers | undefined
): SelectedQuizAnswers {
  if (!userAnswers) {
    return {};
  }

  return mapAnswerIndexesToOptionText(normalizedQuizData, { ...userAnswers });
}

function buildHydratedQuizState(
  baseQuizData: QuizQuestion[],
  normalizedQuizData: QuizQuestion[],
  quizStatusItem?: LessonQuizStatusItem
): HydratedQuizState {
  const latestSubmission = quizStatusItem?.latestSubmission;

  if (!latestSubmission) {
    return {
      bestScore: quizStatusItem?.percentage ?? null,
      hydratedSubmissionKey: null,
      pointsEarned: 0,
      score: 0,
      selectedAnswers: {},
      showResults: false,
    };
  }

  const selectedAnswers = toSelectedQuizAnswers(
    baseQuizData,
    latestSubmission.userAnswers
  );
  const results = calculateQuizResults(normalizedQuizData, selectedAnswers);

  return {
    bestScore: quizStatusItem?.percentage ?? null,
    hydratedSubmissionKey: `${latestSubmission.submissionId}:${latestSubmission.completedAt ?? ""}`,
    pointsEarned: results.pointsEarned,
    score: latestSubmission.score,
    selectedAnswers,
    showResults: true,
  };
}

function buildFailedQuizReviewPrompt(quizData: QuizQuestion[]): string | null {
  if (quizData.length === 0) {
    return null;
  }

  const promptLines = [
    "[SYSTEM: COMPORTAMIENTO ESTRICTO OCULTO PARA EL USUARIO]",
    "El usuario no alcanzo el puntaje requerido en este quiz.",
    "",
    "Preguntas del quiz para orientar el repaso:",
    "",
  ];

  quizData.forEach((question, index) => {
    promptLines.push(`${index + 1}. [Pregunta]: ${question.question}`);
  });

  promptLines.push(
    "",
    "Proporciona una retroalimentacion que invite al usuario a reflexionar sobre los conceptos del quiz basandose en lo que se vio en el video o el material de estudio.",
    "NUNCA le des las respuestas correctas directamente.",
    "Hazle preguntas o menciona conceptos clave que le ayuden a llegar a las respuestas correctas por si mismo.",
    "Adicionalmente, indicale al usuario en que minuto aproximado del video o parte del material puede encontrar la informacion para repasar (utiliza la transcripcion que tienes en tu contexto)."
  );

  return promptLines.join("\n");
}

function getAnsweredQuestionCount(
  questions: QuizQuestion[],
  selectedAnswers: SelectedQuizAnswers
): number {
  return questions.filter((question) => selectedAnswers[question.id] !== undefined)
    .length;
}

function getInitialQuestionIndex(
  questions: QuizQuestion[],
  selectedAnswers: SelectedQuizAnswers,
  showResults: boolean
): number {
  if (questions.length === 0) {
    return 0;
  }

  if (showResults) {
    const firstIncorrectIndex = questions.findIndex((question) => {
      const selectedAnswer = selectedAnswers[question.id];
      return (
        selectedAnswer !== undefined &&
        !isQuizAnswerCorrect(question, selectedAnswer)
      );
    });

    return firstIncorrectIndex >= 0 ? firstIncorrectIndex : 0;
  }

  const firstUnansweredIndex = questions.findIndex(
    (question) => selectedAnswers[question.id] === undefined
  );

  return firstUnansweredIndex >= 0 ? firstUnansweredIndex : 0;
}

function getQuestionResult(
  question: QuizQuestion,
  selectedAnswer: string | number | undefined
): "correct" | "incorrect" | "unanswered" {
  if (selectedAnswer === undefined) {
    return "unanswered";
  }

  return isQuizAnswerCorrect(question, selectedAnswer) ? "correct" : "incorrect";
}

export function QuizRenderer({
  activityId,
  lessonId,
  materialId,
  onQuizSubmitted,
  onRequestQuizFeedback,
  quizData,
  quizStatusItem,
  slug,
  totalPoints,
}: QuizRendererProps) {
  const { t } = useTranslation("learn");
  const organizationId = useCurrentOrganizationId();
  const [quizAttemptVersion, setQuizAttemptVersion] = useState(0);
  const baseQuizData = useMemo(
    () => normalizeQuizQuestions(quizData),
    [quizData]
  );
  const normalizedQuizData = useMemo(
    () => shuffleQuizQuestions(baseQuizData),
    [baseQuizData, quizAttemptVersion]
  );
  const initialHydratedState = useMemo(
    () => buildHydratedQuizState(baseQuizData, normalizedQuizData, quizStatusItem),
    [baseQuizData, normalizedQuizData, quizStatusItem]
  );
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedQuizAnswers>(
    initialHydratedState.selectedAnswers
  );
  const [showResults, setShowResults] = useState(
    initialHydratedState.showResults
  );
  const [score, setScore] = useState(initialHydratedState.score);
  const [pointsEarned, setPointsEarned] = useState(
    initialHydratedState.pointsEarned
  );
  const [bestScore, setBestScore] = useState<number | null>(
    initialHydratedState.bestScore
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() =>
    getInitialQuestionIndex(
      normalizedQuizData,
      initialHydratedState.selectedAnswers,
      initialHydratedState.showResults
    )
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [hydratedSubmissionKey, setHydratedSubmissionKey] = useState<
    string | null
  >(initialHydratedState.hydratedSubmissionKey);

  const totalQuestions = normalizedQuizData.length;
  const currentQuestion = normalizedQuizData[currentQuestionIndex];
  const answeredQuestionCount = getAnsweredQuestionCount(
    normalizedQuizData,
    selectedAnswers
  );
  const allQuestionsAnswered =
    totalQuestions > 0 && answeredQuestionCount === totalQuestions;
  const percentage =
    totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const passed = percentage >= PASSING_THRESHOLD;
  const requiredCorrectAnswers = Math.ceil(
    (totalQuestions * PASSING_THRESHOLD) / 100
  );
  const bestScoreToShow =
    bestScore !== null && bestScore !== percentage ? bestScore : null;
  const latestSubmissionKey = quizStatusItem?.latestSubmission
    ? `${quizStatusItem.latestSubmission.submissionId}:${quizStatusItem.latestSubmission.completedAt ?? ""}`
    : null;
  const feedbackPrompt = useMemo(() => {
    if (!showResults || passed) {
      return null;
    }

    return (
      buildQuizFeedbackPrompt(normalizedQuizData, selectedAnswers) ||
      buildFailedQuizReviewPrompt(normalizedQuizData)
    );
  }, [normalizedQuizData, passed, selectedAnswers, showResults]);

  useEffect(() => {
    if (!latestSubmissionKey || latestSubmissionKey === hydratedSubmissionKey) {
      return;
    }

    const nextHydratedState = buildHydratedQuizState(
      baseQuizData,
      normalizedQuizData,
      quizStatusItem
    );

    setSelectedAnswers(nextHydratedState.selectedAnswers);
    setShowResults(nextHydratedState.showResults);
    setScore(nextHydratedState.score);
    setPointsEarned(nextHydratedState.pointsEarned);
    setBestScore(nextHydratedState.bestScore);
    setCurrentQuestionIndex(
      getInitialQuestionIndex(
        normalizedQuizData,
        nextHydratedState.selectedAnswers,
        nextHydratedState.showResults
      )
    );
    setSubmitError(null);
    setHydratedSubmissionKey(nextHydratedState.hydratedSubmissionKey);
  }, [
    hydratedSubmissionKey,
    latestSubmissionKey,
    baseQuizData,
    normalizedQuizData,
    quizStatusItem,
  ]);

  useEffect(() => {
    if (currentQuestionIndex > Math.max(totalQuestions - 1, 0)) {
      setCurrentQuestionIndex(Math.max(totalQuestions - 1, 0));
    }
  }, [currentQuestionIndex, totalQuestions]);

  const handleAnswerSelect = (questionId: string, answer: string | number) => {
    setSelectedAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: answer,
    }));
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    const unansweredQuestions = normalizedQuizData.filter(
      (question) => selectedAnswers[question.id] === undefined
    );

    if (unansweredQuestions.length > 0) {
      setSubmitError(
        t("activities.quiz.errors.unanswered", {
          count: unansweredQuestions.length,
        })
      );
      setCurrentQuestionIndex(
        getInitialQuestionIndex(normalizedQuizData, selectedAnswers, false)
      );
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const results = calculateQuizResults(normalizedQuizData, selectedAnswers);
      setScore(results.correctCount);
      setPointsEarned(results.pointsEarned);
      setShowResults(true);
      setCurrentQuestionIndex(
        getInitialQuestionIndex(normalizedQuizData, selectedAnswers, true)
      );

      if (
        results.correctCount < normalizedQuizData.length &&
        onRequestQuizFeedback
      ) {
        const prompt = buildQuizFeedbackPrompt(
          normalizedQuizData,
          selectedAnswers
        );

        if (prompt) {
          onRequestQuizFeedback(prompt);
        }
      }

      if (lessonId && slug) {
        await submitQuizResults({
          activityId,
          lessonId,
          materialId,
          normalizedQuizData,
          organizationId,
          onQuizSubmitted,
          saveErrorMessage: t("activities.quiz.errors.save"),
          selectedAnswers,
          setBestScore,
          setServerMessage,
          setSubmitError,
          slug,
          totalPoints,
        });
      }
    } catch (error) {
      console.error("Error procesando quiz:", error);
      setSubmitError(t("activities.quiz.errors.process"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
    setPointsEarned(0);
    setQuizAttemptVersion((current) => current + 1);
    setCurrentQuestionIndex(0);
    setSubmitError(null);
    setServerMessage(null);
  };

  if (totalQuestions === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
        {t("activities.quiz.empty")}
      </div>
    );
  }

  return (
    <section className="space-y-4" aria-label={t("activities.quiz.title")}>
      <QuizProgressHeader
        answeredQuestionCount={answeredQuestionCount}
        currentQuestionIndex={currentQuestionIndex}
        onQuestionSelect={setCurrentQuestionIndex}
        passingThreshold={PASSING_THRESHOLD}
        questions={normalizedQuizData}
        requiredCorrectAnswers={requiredCorrectAnswers}
        selectedAnswers={selectedAnswers}
        showResults={showResults}
        totalPoints={totalPoints}
      />

      {currentQuestion && (
        <QuizQuestionCard
          currentQuestionIndex={currentQuestionIndex}
          onAnswerSelect={handleAnswerSelect}
          question={currentQuestion}
          selectedAnswer={selectedAnswers[currentQuestion.id]}
          showResults={showResults}
          totalQuestions={totalQuestions}
        />
      )}

      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {submitError}
        </div>
      )}

      {serverMessage && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/60">
          {serverMessage}
        </div>
      )}

      <QuizNavigation
        allQuestionsAnswered={allQuestionsAnswered}
        currentQuestionIndex={currentQuestionIndex}
        isSubmitting={isSubmitting}
        onNext={() =>
          setCurrentQuestionIndex((current) =>
            Math.min(current + 1, totalQuestions - 1)
          )
        }
        onPrevious={() =>
          setCurrentQuestionIndex((current) => Math.max(current - 1, 0))
        }
        onSubmit={handleSubmit}
        showResults={showResults}
        totalQuestions={totalQuestions}
      />

      {showResults && (
        <QuizResultSummary
          bestScore={bestScoreToShow}
          feedbackPrompt={feedbackPrompt}
          onRequestQuizFeedback={onRequestQuizFeedback}
          onRetry={handleRetry}
          passed={passed}
          percentage={percentage}
          pointsEarned={pointsEarned}
          score={score}
          totalPoints={totalPoints}
          totalQuestions={totalQuestions}
        />
      )}
    </section>
  );
}

type QuizProgressHeaderProps = {
  answeredQuestionCount: number;
  currentQuestionIndex: number;
  onQuestionSelect: (index: number) => void;
  passingThreshold: number;
  questions: QuizQuestion[];
  requiredCorrectAnswers: number;
  selectedAnswers: SelectedQuizAnswers;
  showResults: boolean;
  totalPoints?: number;
};

function QuizProgressHeader({
  answeredQuestionCount,
  currentQuestionIndex,
  onQuestionSelect,
  passingThreshold,
  questions,
  requiredCorrectAnswers,
  selectedAnswers,
  showResults,
  totalPoints,
}: QuizProgressHeaderProps) {
  const { t } = useTranslation("learn");
  const totalQuestions = questions.length;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-gray-500 dark:text-white/40">
            {t("activities.quiz.title")}
          </p>
          <p className="mt-1 text-sm text-gray-700 dark:text-white/70">
            {t("activities.quiz.instructions", { count: totalQuestions })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-white/45">
          {totalPoints !== undefined && (
            <span className="rounded bg-gray-100 px-2 py-1 dark:bg-white/5">
              {t("activities.quiz.points", { count: totalPoints })}
            </span>
          )}
          <span className="rounded bg-gray-100 px-2 py-1 dark:bg-white/5">
            {t("activities.quiz.threshold", { value: passingThreshold })}
          </span>
          <span className="rounded bg-gray-100 px-2 py-1 dark:bg-white/5">
            {t("activities.quiz.requiredCorrect", {
              count: requiredCorrectAnswers,
              total: totalQuestions,
            })}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          {questions.map((question, index) => {
            const selectedAnswer = selectedAnswers[question.id];
            const result = showResults
              ? getQuestionResult(question, selectedAnswer)
              : selectedAnswer === undefined
                ? "unanswered"
                : "correct";

            return (
              <button
                key={question.id}
                type="button"
                onClick={() => onQuestionSelect(index)}
                className={cn(
                  "h-8 w-8 rounded-full border text-xs font-semibold transition-colors",
                  currentQuestionIndex === index &&
                    "ring-2 ring-accent ring-offset-2 ring-offset-white dark:ring-offset-gray-900",
                  result === "correct" &&
                    "border-emerald-500 bg-emerald-500 text-white",
                  result === "incorrect" && "border-red-500 bg-red-500 text-white",
                  result === "unanswered" &&
                    "border-gray-200 bg-gray-100 text-gray-500 hover:bg-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white/50 dark:hover:bg-white/10"
                )}
                aria-label={t("activities.quiz.goToQuestion", {
                  number: index + 1,
                })}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
        <p className="text-xs font-medium text-gray-500 dark:text-white/45">
          {t("activities.quiz.answered", {
            answered: answeredQuestionCount,
            total: totalQuestions,
          })}
        </p>
      </div>
    </div>
  );
}

type QuizQuestionCardProps = {
  currentQuestionIndex: number;
  onAnswerSelect: (questionId: string, answer: string | number) => void;
  question: QuizQuestion;
  selectedAnswer?: string | number;
  showResults: boolean;
  totalQuestions: number;
};

function QuizQuestionCard({
  currentQuestionIndex,
  onAnswerSelect,
  question,
  selectedAnswer,
  showResults,
  totalQuestions,
}: QuizQuestionCardProps) {
  const { t } = useTranslation("learn");
  const result = showResults
    ? getQuestionResult(question, selectedAnswer)
    : "unanswered";
  const showCorrectExplanation =
    showResults && result === "correct" && selectedAnswer !== undefined;

  return (
    <article
      className={cn(
        "rounded-lg border bg-white shadow-sm transition-colors dark:bg-white/[0.02] dark:shadow-none",
        showResults && result === "correct"
          ? "border-emerald-500/30"
          : showResults && result === "incorrect"
            ? "border-red-500/30"
            : "border-gray-200 dark:border-white/10"
      )}
    >
      <header className="border-b border-gray-200 px-4 py-4 dark:border-white/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase text-gray-500 dark:text-white/40">
              {t("activities.quiz.questionProgress", {
                current: currentQuestionIndex + 1,
                total: totalQuestions,
              })}
            </p>
            <h3 className="mt-2 text-base font-semibold leading-relaxed text-gray-900 dark:text-white md:text-lg">
              {question.question}
            </h3>
          </div>
          {question.points && (
            <span className="w-fit rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500 dark:bg-white/5 dark:text-white/50">
              {t("activities.quiz.points", { count: question.points })}
            </span>
          )}
        </div>
      </header>

      <div className="space-y-2 p-3 sm:p-4">
        {question.options.map((option, optionIndex) => (
          <QuizOption
            key={`${question.id}-${optionIndex}`}
            onAnswerSelect={onAnswerSelect}
            option={option}
            optionIndex={optionIndex}
            question={question}
            selectedAnswer={selectedAnswer}
            showResults={showResults}
          />
        ))}
      </div>

      {showCorrectExplanation && question.explanation && (
        <div className="mx-4 mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <span className="font-medium text-emerald-700 dark:text-emerald-300">
            {t("activities.quiz.correct")}
          </span>
          <p className="mt-1 leading-relaxed text-gray-700 dark:text-white/65">
            {selectedAnswer !== undefined
              ? parseQuizExplanation(question, selectedAnswer)
              : null}
          </p>
        </div>
      )}
    </article>
  );
}

type QuizOptionProps = {
  onAnswerSelect: (questionId: string, answer: string | number) => void;
  option: string;
  optionIndex: number;
  question: QuizQuestion;
  selectedAnswer?: string | number;
  showResults: boolean;
};

function QuizOption({
  onAnswerSelect,
  option,
  optionIndex,
  question,
  selectedAnswer,
  showResults,
}: QuizOptionProps) {
  const { t } = useTranslation("learn");
  const optionLetter = String.fromCharCode(65 + optionIndex);
  const isSelected = selectedAnswer === optionIndex || selectedAnswer === option;
  const selectedResult =
    isSelected && showResults
      ? getQuestionResult(question, selectedAnswer)
      : "unanswered";

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={`${optionLetter}. ${option}`}
      disabled={showResults}
      onClick={() => onAnswerSelect(question.id, option)}
      className={cn(
        "flex min-h-[64px] w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-left transition-all disabled:cursor-default sm:px-4",
        !showResults &&
          !isSelected &&
          "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/70 dark:hover:bg-white/[0.06]",
        !showResults &&
          isSelected &&
          "border-primary bg-primary/5 text-gray-900 shadow-sm dark:border-accent dark:bg-accent/10 dark:text-white",
        showResults &&
          !isSelected &&
          "border-gray-200 bg-transparent text-gray-500 dark:border-white/10 dark:text-white/45",
        selectedResult === "correct" &&
          "border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300",
        selectedResult === "incorrect" &&
          "border-red-500/40 bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-300"
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-sm font-semibold",
          !showResults &&
            !isSelected &&
            "bg-white text-gray-500 dark:bg-white/5 dark:text-white/55",
          !showResults &&
            isSelected &&
            "bg-primary text-white dark:bg-accent dark:text-primary",
          showResults &&
            !isSelected &&
            "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-white/45",
          selectedResult === "correct" && "bg-emerald-500 text-white",
          selectedResult === "incorrect" && "bg-red-500 text-white"
        )}
      >
        {optionLetter}
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium leading-relaxed sm:text-base">
        {option}
      </span>
      {selectedResult === "correct" && (
        <CheckCircle
          className="h-5 w-5 flex-shrink-0 text-emerald-500 dark:text-emerald-300"
          aria-label={t("activities.quiz.correct")}
        />
      )}
      {selectedResult === "incorrect" && (
        <X
          className="h-5 w-5 flex-shrink-0 text-red-500 dark:text-red-300"
          aria-label={t("activities.quiz.incorrect")}
        />
      )}
    </button>
  );
}

type QuizNavigationProps = {
  allQuestionsAnswered: boolean;
  currentQuestionIndex: number;
  isSubmitting: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  showResults: boolean;
  totalQuestions: number;
};

function QuizNavigation({
  allQuestionsAnswered,
  currentQuestionIndex,
  isSubmitting,
  onNext,
  onPrevious,
  onSubmit,
  showResults,
  totalQuestions,
}: QuizNavigationProps) {
  const { t } = useTranslation("learn");
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  return (
    <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirstQuestion}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("activities.quiz.previous")}
      </button>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {!showResults && isLastQuestion && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={!allQuestionsAnswered || isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-accent dark:text-primary"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("activities.quiz.saving")}
              </>
            ) : (
              t("activities.quiz.submit")
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onNext}
          disabled={isLastQuestion}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
        >
          {t("activities.quiz.next")}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

type QuizResultSummaryProps = {
  bestScore: number | null;
  feedbackPrompt: string | null;
  onRequestQuizFeedback?: (prompt: string) => void;
  onRetry: () => void;
  passed: boolean;
  percentage: number;
  pointsEarned: number;
  score: number;
  totalPoints?: number;
  totalQuestions: number;
};

function QuizResultSummary({
  bestScore,
  feedbackPrompt,
  onRequestQuizFeedback,
  onRetry,
  passed,
  percentage,
  pointsEarned,
  score,
  totalPoints,
  totalQuestions,
}: QuizResultSummaryProps) {
  const { t } = useTranslation("learn");

  return (
    <div
      className={cn(
        "rounded-lg border p-4 text-center",
        passed
          ? "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10"
          : "border-red-500/30 bg-red-50 dark:bg-red-500/10"
      )}
    >
      <div
        className={cn(
          "mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full",
          passed ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
        )}
      >
        {passed ? <CheckCircle className="h-5 w-5" /> : <X className="h-5 w-5" />}
      </div>
      <h3
        className={cn(
          "text-lg font-semibold",
          passed
            ? "text-emerald-700 dark:text-emerald-300"
            : "text-red-700 dark:text-red-300"
        )}
      >
        {passed
          ? t("activities.quiz.resultPassed")
          : t("activities.quiz.resultFailed")}
      </h3>
      <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white">
        {t("activities.quiz.correctCount", {
          score,
          total: totalQuestions,
        })}
      </p>
      {totalPoints !== undefined && (
        <p className="mt-1 text-xs text-gray-500 dark:text-white/60">
          {t("activities.quiz.pointsEarned", {
            earned: pointsEarned,
            total: totalPoints,
          })}
        </p>
      )}
      <p className="mt-1 text-xs text-gray-500 dark:text-white/60">
        {t("activities.quiz.requiredScore", {
          percentage,
          threshold: PASSING_THRESHOLD,
        })}
      </p>
      {bestScore !== null && (
        <p className="mt-1 text-xs font-medium text-gray-600 dark:text-white/65">
          {t("activities.quiz.bestScore", { percentage: bestScore })}
        </p>
      )}

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {feedbackPrompt && onRequestQuizFeedback && (
          <button
            type="button"
            onClick={() => onRequestQuizFeedback(feedbackPrompt)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/15 dark:bg-accent/10 dark:text-accent dark:hover:bg-accent/15"
          >
            <Eye className="h-3.5 w-3.5" />
            {t("activities.quizFeedback.open")}
          </button>
        )}
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/15"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t("activities.quiz.retry")}
        </button>
      </div>
    </div>
  );
}

async function submitQuizResults({
  activityId,
  lessonId,
  materialId,
  normalizedQuizData,
  organizationId,
  onQuizSubmitted,
  saveErrorMessage,
  selectedAnswers,
  setBestScore,
  setServerMessage,
  setSubmitError,
  slug,
  totalPoints,
}: SubmitQuizResultsParams): Promise<void> {
  try {
    const response = await fetch(
      `/api/courses/${slug}/lessons/${lessonId}/quiz/submit`,
      {
        body: JSON.stringify({
          activityId: activityId || null,
          answers: selectedAnswers,
          materialId: materialId || null,
          organizationId,
          quizData: normalizedQuizData,
          totalPoints,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }
    );

    const result = (await response.json()) as QuizSubmitResponse;

    if (!response.ok) {
      console.error("Error guardando quiz:", result.error);
      setSubmitError(result.error || saveErrorMessage);
      return;
    }

    if (typeof result.result?.bestScore === "number") {
      setBestScore(result.result.bestScore);
    }

    if (result.message) {
      setServerMessage(result.message);
    }

    onQuizSubmitted?.();
  } catch (error) {
    console.error("Error al enviar quiz:", error);
    setSubmitError(saveErrorMessage);
  }
}
