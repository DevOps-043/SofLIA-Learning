import { CheckCircle2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { isQuizAnswerCorrect, type QuizQuestion } from "@/features/courses/components/learn/quiz.utils";

type QuizOptionProps = {
  onAnswerSelect: (questionId: string, answer: string | number) => void;
  option: string;
  optionIndex: number;
  question: QuizQuestion;
  selectedAnswer?: string | number;
  showResults: boolean;
};

// La clave de respuestas se conoce solo tras enviar (el payload de carga ya no la
// incluye). Sin ella, no marcamos correcto/incorrecto para evitar falsos negativos.
function isAnswerKeyKnown(question: QuizQuestion): boolean {
  return question.correctAnswer !== undefined && question.correctAnswer !== "";
}

export function QuizOption({
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
  const answerKeyKnown = isAnswerKeyKnown(question);
  const isCorrectOption = answerKeyKnown && isQuizAnswerCorrect(question, optionIndex);
  const showGrading = showResults && answerKeyKnown;

  return (
    <label
      className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-all ${
      showGrading
        ? isSelected && isCorrectOption
          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
          : isSelected && !isCorrectOption
            ? "border-red-300 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
            : "border-transparent bg-transparent text-gray-500 dark:text-white/50"
        : isSelected
          ? "text-gray-900 shadow-sm dark:text-white"
          : "border-gray-200/70 bg-white/45 text-gray-600 hover:border-[color-mix(in_srgb,var(--learn-accent)_24%,transparent)] hover:bg-[color-mix(in_srgb,var(--learn-accent)_4%,transparent)] hover:text-gray-900 dark:border-white/10 dark:bg-white/[0.015] dark:text-white/60 dark:hover:text-white/85"
      }`}
      style={!showGrading && isSelected ? {
        borderColor: 'color-mix(in srgb, var(--learn-accent) 38%, transparent)',
        backgroundColor: 'color-mix(in srgb, var(--learn-accent) 8%, transparent)',
      } : undefined}
    >
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
        showGrading
          ? isSelected && isCorrectOption
            ? "border-emerald-500 dark:border-emerald-400 bg-emerald-500 dark:bg-emerald-400"
            : isSelected && !isCorrectOption
              ? "border-red-500 dark:border-red-400 bg-red-500 dark:bg-red-400"
              : "border-gray-300 dark:border-white/20"
          : isSelected
            ? "border-[var(--learn-action)] bg-[var(--learn-action)]"
            : "border-gray-300 dark:border-white/20"
      }`}>
        {((showGrading && (isCorrectOption || (isSelected && !isCorrectOption))) || (!showGrading && isSelected)) && (
          <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-black" />
        )}
      </div>
      <input type="radio" name={`question-${question.id}`} value={optionIndex} checked={isSelected} onChange={() => onAnswerSelect(question.id, optionIndex)} disabled={showResults} className="hidden" />
      <span className="text-xs font-medium opacity-60 dark:opacity-50 mr-1">({optionLetter})</span>
      <span className="text-sm flex-1">{option}</span>
      {showGrading && isSelected && isCorrectOption && (
        <CheckCircle2
          aria-label={t("activities.quiz.correct")}
          className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0"
        />
      )}
      {showGrading && isSelected && !isCorrectOption && (
        <X
          aria-label={t("activities.quiz.incorrect")}
          className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0"
        />
      )}
    </label>
  );
}
