import { CheckCircle, X } from "lucide-react";

import {
  isQuizAnswerCorrect,
  type QuizQuestion,
} from "../quiz.utils";

type QuizOptionProps = {
  onAnswerSelect: (questionId: string, answer: string | number) => void;
  option: string;
  optionIndex: number;
  question: QuizQuestion;
  selectedAnswer?: string | number;
  showResults: boolean;
};

function getOptionClasses(
  showResults: boolean,
  isSelected: boolean,
  isCorrectOption: boolean,
) {
  if (showResults) {
    if (isSelected && isCorrectOption) {
      return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    }

    if (isSelected && !isCorrectOption) {
      return "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400";
    }

    return "bg-transparent text-gray-500 dark:text-white/50";
  }

  return isSelected
    ? "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
    : "bg-transparent text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white/80";
}

function getMarkerClasses(
  showResults: boolean,
  isSelected: boolean,
  isCorrectOption: boolean,
) {
  if (showResults) {
    if (isSelected && isCorrectOption) {
      return "border-emerald-500 dark:border-emerald-400 bg-emerald-500 dark:bg-emerald-400";
    }

    if (isSelected && !isCorrectOption) {
      return "border-red-500 dark:border-red-400 bg-red-500 dark:bg-red-400";
    }

    return "border-gray-300 dark:border-white/20";
  }

  return isSelected
    ? "border-gray-900 dark:border-white bg-gray-900 dark:bg-white"
    : "border-gray-300 dark:border-white/20";
}

export function QuizOption({
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
  const shouldShowMarker =
    (showResults && (isCorrectOption || (isSelected && !isCorrectOption))) ||
    (!showResults && isSelected);

  return (
    <label className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all ${getOptionClasses(showResults, isSelected, isCorrectOption)}`}>
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${getMarkerClasses(showResults, isSelected, isCorrectOption)}`}>
        {shouldShowMarker && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-black" />}
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
      {showResults && isSelected && isCorrectOption && <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />}
      {showResults && isSelected && !isCorrectOption && <X className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />}
    </label>
  );
}
