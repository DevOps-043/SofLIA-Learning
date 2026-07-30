import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  isQuizAnswerCorrect,
  type QuizQuestion,
  type SelectedQuizAnswers,
} from "@/features/courses/components/learn/quiz.utils";

type QuizQuestionNavigatorProps = {
  currentQuestionIndex: number;
  onQuestionChange: (index: number) => void;
  questions: QuizQuestion[];
  selectedAnswers: SelectedQuizAnswers;
  showResults: boolean;
};

export function QuizQuestionNavigator({
  currentQuestionIndex,
  onQuestionChange,
  questions,
  selectedAnswers,
  showResults,
}: QuizQuestionNavigatorProps) {
  const { t } = useTranslation("learn");

  if (questions.length <= 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {questions.map((question, index) => {
        const selectedAnswer = selectedAnswers[question.id];
        const isAnswered = selectedAnswer !== undefined;
        const isCurrent = currentQuestionIndex === index;
        const isCorrect =
          isAnswered && isQuizAnswerCorrect(question, selectedAnswer);
        const resultLabel = showResults
          ? isCorrect
            ? t("activities.quiz.correct")
            : t("activities.quiz.incorrect")
          : isAnswered
            ? t("activities.quiz.answered", {
                answered: index + 1,
                total: questions.length,
              })
            : t("activities.quiz.goToQuestion", { number: index + 1 });

        return (
          <button
            key={question.id}
            type="button"
            onClick={() => onQuestionChange(index)}
            className={`relative inline-flex h-8 w-8 items-center justify-center rounded-[0.62rem] border text-[11px] font-semibold transition-all ${
              showResults
                ? isCorrect
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-red-500 bg-red-500 text-white"
                : isAnswered
                  ? "text-white"
                  : "border-gray-200/90 bg-white/70 text-gray-500 hover:text-[var(--learn-accent)] dark:border-white/10 dark:bg-white/5 dark:text-white/50"
            } ${
              isCurrent
                ? "ring-2 ring-[color-mix(in_srgb,var(--learn-accent)_24%,transparent)] ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
                : ""
            }`}
            style={!showResults && isAnswered ? {
              borderColor: 'var(--learn-action)',
              backgroundColor: 'var(--learn-action)',
              color: 'var(--learn-on-action)',
            } : !showResults && isCurrent ? {
              borderColor: 'color-mix(in srgb, var(--learn-accent) 45%, transparent)',
              backgroundColor: 'color-mix(in srgb, var(--learn-accent) 8%, transparent)',
              color: 'var(--learn-accent)',
            } : undefined}
            aria-label={`${t("activities.quiz.goToQuestion", { number: index + 1 })}. ${resultLabel}`}
            aria-current={isCurrent ? "step" : undefined}
            title={`${t("activities.quiz.goToQuestion", { number: index + 1 })}. ${resultLabel}`}
          >
            {showResults ? (
              isCorrect ? (
                <Check className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )
            ) : (
              index + 1
            )}
          </button>
        );
      })}
    </div>
  );
}
