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
            className={`relative inline-flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold transition-all ${
              showResults
                ? isCorrect
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-red-500 bg-red-500 text-white"
                : isAnswered
                  ? "border-primary bg-primary text-white"
                  : "border-gray-300 bg-white text-gray-500 hover:border-primary hover:text-primary dark:border-white/15 dark:bg-white/5 dark:text-white/50 dark:hover:border-accent dark:hover:text-accent"
            } ${
              isCurrent
                ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-white dark:ring-accent/50 dark:ring-offset-gray-900"
                : ""
            }`}
            style={!showResults && isAnswered ? {
              borderColor: 'var(--learn-action)',
              backgroundColor: 'var(--learn-action)',
              color: 'var(--learn-on-action)',
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
