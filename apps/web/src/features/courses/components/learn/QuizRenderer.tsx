"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Eye,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  buildQuizFeedbackPrompt,
  calculateQuizResults,
  isQuizAnswerCorrect,
  normalizeQuizQuestions,
  parseQuizExplanation,
  type QuizQuestion,
  type SelectedQuizAnswers,
} from "@/features/courses/components/learn/quiz.utils";
import { useCurrentOrganizationId } from "@/core/stores/organizationStore";
import type { LessonQuizStatusItem } from "@/features/courses/components/learn/types";
import type { QuizSubmissionAnswers } from "@/features/courses/services/quiz-submission.service";

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
  hydratedSubmissionKey: string | null;
  pointsEarned: number;
  score: number;
  selectedAnswers: SelectedQuizAnswers;
  showResults: boolean;
};

function toSelectedQuizAnswers(
  userAnswers: QuizSubmissionAnswers | undefined
): SelectedQuizAnswers {
  if (!userAnswers) {
    return {};
  }

  return { ...userAnswers };
}

function buildHydratedQuizState(
  normalizedQuizData: QuizQuestion[],
  quizStatusItem?: LessonQuizStatusItem
): HydratedQuizState {
  const latestSubmission = quizStatusItem?.latestSubmission;

  if (!latestSubmission) {
    return {
      hydratedSubmissionKey: null,
      pointsEarned: 0,
      score: 0,
      selectedAnswers: {},
      showResults: false,
    };
  }

  const selectedAnswers = toSelectedQuizAnswers(latestSubmission.userAnswers);
  const results = calculateQuizResults(normalizedQuizData, selectedAnswers);

  return {
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
    "Adicionalmente, indicale al usuario en que minuto aproximado del video o parte del material puede encontrar la informacion para repasar (utiliza la transcripcion que tienes en tu contexto).",
  );

  return promptLines.join("\n");
}

export function QuizRenderer({
  quizData,
  totalPoints,
  quizStatusItem,
  lessonId,
  slug,
  materialId,
  activityId,
  onRequestQuizFeedback,
  onQuizSubmitted,
}: QuizRendererProps) {
  const { t } = useTranslation("learn");
  const organizationId = useCurrentOrganizationId();
  const normalizedQuizData = useMemo(
    () => normalizeQuizQuestions(quizData),
    [quizData]
  );
  const initialHydratedState = useMemo(
    () => buildHydratedQuizState(normalizedQuizData, quizStatusItem),
    [normalizedQuizData, quizStatusItem]
  );
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedQuizAnswers>(
    initialHydratedState.selectedAnswers
  );
  const [showResults, setShowResults] = useState(initialHydratedState.showResults);
  const [score, setScore] = useState(initialHydratedState.score);
  const [pointsEarned, setPointsEarned] = useState(initialHydratedState.pointsEarned);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [hydratedSubmissionKey, setHydratedSubmissionKey] = useState<string | null>(
    initialHydratedState.hydratedSubmissionKey
  );

  const totalQuestions = normalizedQuizData.length;
  const percentage =
    totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const passingThreshold = 80;
  const passed = percentage >= passingThreshold;
  const feedbackPrompt = useMemo(() => {
    if (!showResults || passed) {
      return null;
    }

    return (
      buildQuizFeedbackPrompt(normalizedQuizData, selectedAnswers) ||
      buildFailedQuizReviewPrompt(normalizedQuizData)
    );
  }, [normalizedQuizData, passed, selectedAnswers, showResults]);
  const latestSubmissionKey = quizStatusItem?.latestSubmission
    ? `${quizStatusItem.latestSubmission.submissionId}:${quizStatusItem.latestSubmission.completedAt ?? ""}`
    : null;

  useEffect(() => {
    if (!latestSubmissionKey || latestSubmissionKey === hydratedSubmissionKey) {
      return;
    }

    const nextHydratedState = buildHydratedQuizState(
      normalizedQuizData,
      quizStatusItem
    );

    setSelectedAnswers(nextHydratedState.selectedAnswers);
    setShowResults(nextHydratedState.showResults);
    setScore(nextHydratedState.score);
    setPointsEarned(nextHydratedState.pointsEarned);
    setSubmitError(null);
    setHydratedSubmissionKey(nextHydratedState.hydratedSubmissionKey);
  }, [
    hydratedSubmissionKey,
    latestSubmissionKey,
    normalizedQuizData,
    quizStatusItem,
  ]);

  const handleAnswerSelect = (questionId: string, answer: string | number) => {
    setSelectedAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    const unansweredQuestions = normalizedQuizData.filter(
      (question) => selectedAnswers[question.id] === undefined
    );

    if (unansweredQuestions.length > 0) {
      setSubmitError(
        `Por favor responde todas las preguntas (${unansweredQuestions.length} sin responder)`
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
          selectedAnswers,
          setServerMessage,
          setSubmitError,
          slug,
          totalPoints,
        });
      }
    } catch (error) {
      console.error("Error procesando quiz:", error);
      setSubmitError("Error al procesar el quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
    setPointsEarned(0);
    setSubmitError(null);
    setServerMessage(null);
  };

  return (
    <div className="space-y-5">
      <div className="px-4 py-3 border-l-2 border-gray-300 dark:border-white/20">
        <p className="text-gray-600 dark:text-white/60 text-xs mb-1">
          Responde las {totalQuestions} pregunta
          {totalQuestions !== 1 ? "s" : ""} para completar este quiz.
        </p>
        <div className="flex items-center gap-4 text-[10px] text-gray-400 dark:text-white/40">
          {totalPoints !== undefined && <span>{totalPoints} puntos</span>}
          <span>Umbral: {passingThreshold}%</span>
          <span>
            ({Math.ceil((totalQuestions * passingThreshold) / 100)} de{" "}
            {totalQuestions} para aprobar)
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {normalizedQuizData.map((question, index) => {
          const selectedAnswer = selectedAnswers[question.id];
          const isCorrect =
            selectedAnswer !== undefined &&
            isQuizAnswerCorrect(question, selectedAnswer);
          const showExplanation = showResults && selectedAnswer !== undefined;

          return (
            <QuizQuestionCard
              key={question.id}
              index={index}
              isCorrect={isCorrect}
              onAnswerSelect={handleAnswerSelect}
              question={question}
              selectedAnswer={selectedAnswer}
              showExplanation={showExplanation}
              showResults={showResults}
            />
          );
        })}
      </div>

      {submitError && (
        <div className="px-3 py-2 rounded-md bg-red-500/10 border border-red-500/20">
          <p className="text-red-400 text-xs">{submitError}</p>
        </div>
      )}

      {showResults && !passed && feedbackPrompt && onRequestQuizFeedback && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onRequestQuizFeedback(feedbackPrompt)}
            className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/15 dark:bg-accent/10 dark:text-accent dark:hover:bg-accent/15"
          >
            <Eye className="h-3.5 w-3.5" />
            {t("activities.quizFeedback.open")}
          </button>
        </div>
      )}

      {!showResults && (
        <div className="flex justify-end pt-3 border-t border-white/5">
          <button
            onClick={handleSubmit}
            disabled={
              Object.keys(selectedAnswers).length < totalQuestions || isSubmitting
            }
            className="px-4 py-2 rounded-md text-sm font-medium bg-[#0A2540] hover:bg-[#0d2f4d] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Guardando...
              </>
            ) : (
              "Enviar Respuestas"
            )}
          </button>
        </div>
      )}

      {showResults && (
        <div
          className={`rounded-lg border p-5 ${
            passed
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-red-500/30 bg-red-500/5"
          }`}
        >
          {serverMessage && (
            <div className="mb-4 px-3 py-2 rounded-md bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <p className="text-gray-600 dark:text-white/60 text-xs">
                {serverMessage}
              </p>
            </div>
          )}

          <div className="text-center">
            <p
              className={`text-lg font-semibold mb-1 ${
                passed
                  ? "text-emerald-500 font-bold dark:text-emerald-400"
                  : "text-red-500 font-bold dark:text-red-400"
              }`}
            >
              {passed ? "✓ Aprobado" : "✗ No aprobado"}
            </p>
            <p className="text-gray-800 dark:text-white text-sm mb-1 font-medium">
              {score} de {totalQuestions} correctas
            </p>
            {totalPoints !== undefined && (
              <p className="text-gray-500 dark:text-white/60 text-xs mb-1">
                {pointsEarned} de {totalPoints} puntos
              </p>
            )}
            <p className="text-gray-400 dark:text-white/40 text-xs">
              {percentage}% | Requerido: {passingThreshold}%
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {feedbackPrompt && onRequestQuizFeedback && (
              <button
                onClick={() => onRequestQuizFeedback(feedbackPrompt)}
                className="px-4 py-2 rounded-md text-xs font-medium bg-primary/10 hover:bg-primary/15 text-primary dark:bg-accent/10 dark:hover:bg-accent/15 dark:text-accent transition-colors flex items-center gap-2"
              >
                <Eye className="w-3.5 h-3.5" />
                {t("activities.quizFeedback.open")}
              </button>
            )}
            <button
              onClick={handleRetry}
              className="px-4 py-2 rounded-md text-xs font-medium bg-gray-200 hover:bg-gray-300 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-white/70 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reintentar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type QuizQuestionCardProps = {
  index: number;
  isCorrect: boolean;
  onAnswerSelect: (questionId: string, answer: string | number) => void;
  question: QuizQuestion;
  selectedAnswer?: string | number;
  showExplanation: boolean;
  showResults: boolean;
};

function QuizQuestionCard({
  index,
  isCorrect,
  onAnswerSelect,
  question,
  selectedAnswer,
  showExplanation,
  showResults,
}: QuizQuestionCardProps) {
  return (
    <div
      className={`relative rounded-lg border transition-colors ${
        showResults
          ? isCorrect
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-red-500/30 bg-red-500/5"
          : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02]"
      }`}
    >
      <div className="px-4 py-3 border-b border-gray-200 dark:border-white/5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <span className="w-6 h-6 rounded-md bg-gray-200 dark:bg-white/5 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-white/50 flex-shrink-0">
            {index + 1}
          </span>
          <p className="text-sm text-gray-900 dark:text-white leading-relaxed flex-1">
            {question.question}
          </p>
        </div>
        {question.points && (
          <span className="text-[10px] text-gray-400 dark:text-white/30 px-2 py-0.5 bg-gray-100 dark:bg-white/5 rounded flex-shrink-0">
            {question.points} pt{question.points > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="p-3 space-y-1.5">
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

      {showExplanation && question.explanation && isCorrect && (
        <div className="mx-3 mb-3 px-3 py-2 rounded-md text-xs bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
          <span className="font-medium text-emerald-700 dark:text-emerald-400">
            ✓ Correcto
          </span>
          <p className="text-gray-700 dark:text-white/60 mt-1 leading-relaxed">
            {selectedAnswer !== undefined
              ? parseQuizExplanation(question, selectedAnswer)
              : null}
          </p>
        </div>
      )}
    </div>
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
  const optionLetter = String.fromCharCode(65 + optionIndex);
  const isSelected = selectedAnswer === optionIndex || selectedAnswer === option;
  const isCorrectOption = isQuizAnswerCorrect(question, optionIndex);

  return (
    <label
      className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all ${
        showResults
          ? isSelected && isCorrectOption
            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : isSelected && !isCorrectOption
              ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
              : "bg-transparent text-gray-500 dark:text-white/50"
          : isSelected
            ? "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
            : "bg-transparent text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white/80"
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          showResults
            ? isSelected && isCorrectOption
              ? "border-emerald-500 dark:border-emerald-400 bg-emerald-500 dark:bg-emerald-400"
              : isSelected && !isCorrectOption
                ? "border-red-500 dark:border-red-400 bg-red-500 dark:bg-red-400"
                : "border-gray-300 dark:border-white/20"
            : isSelected
              ? "border-gray-900 dark:border-white bg-gray-900 dark:bg-white"
              : "border-gray-300 dark:border-white/20"
        }`}
      >
        {((showResults &&
          (isCorrectOption || (isSelected && !isCorrectOption))) ||
          (!showResults && isSelected)) && (
          <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-black" />
        )}
      </div>
      <input
        type="radio"
        name={`question-${question.id}`}
        value={optionIndex}
        checked={isSelected}
        onChange={() => onAnswerSelect(question.id, optionIndex)}
        disabled={showResults}
        className="hidden"
      />
      <span className="text-xs font-medium opacity-60 dark:opacity-50 mr-1">
        ({optionLetter})
      </span>
      <span className="text-sm flex-1">{option}</span>
      {showResults && isSelected && isCorrectOption && (
        <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
      )}
      {showResults && isSelected && !isCorrectOption && (
        <X className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
      )}
    </label>
  );
}

type SubmitQuizResultsParams = {
  activityId?: string;
  lessonId: string;
  materialId?: string;
  normalizedQuizData: QuizQuestion[];
  organizationId?: string | null;
  onQuizSubmitted?: () => void;
  selectedAnswers: SelectedQuizAnswers;
  setServerMessage: (message: string | null) => void;
  setSubmitError: (error: string | null) => void;
  slug: string;
  totalPoints?: number;
};

async function submitQuizResults({
  activityId,
  lessonId,
  materialId,
  normalizedQuizData,
  organizationId,
  onQuizSubmitted,
  selectedAnswers,
  setServerMessage,
  setSubmitError,
  slug,
  totalPoints,
}: SubmitQuizResultsParams): Promise<void> {
  try {
    const response = await fetch(
      `/api/courses/${slug}/lessons/${lessonId}/quiz/submit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: selectedAnswers,
          quizData: normalizedQuizData,
          materialId: materialId || null,
          activityId: activityId || null,
          organizationId,
          totalPoints,
        }),
      }
    );

    const result = (await response.json()) as {
      error?: string;
      message?: string;
      result?: {
        submission?: {
          submission_id?: string;
        };
      };
    };

    if (!response.ok) {
      console.error("Error guardando quiz:", result.error);
      setSubmitError(result.error || "Error al guardar las respuestas");
      return;
    }

    if (result.message) {
      setServerMessage(result.message);
    }

    onQuizSubmitted?.();
  } catch (error) {
    console.error("Error al enviar quiz:", error);
    setSubmitError("Error al guardar las respuestas");
  }
}
