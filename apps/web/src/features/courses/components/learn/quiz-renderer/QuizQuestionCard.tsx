import { parseQuizExplanation, isQuizAnswerCorrect, type QuizQuestion } from "@/features/courses/components/learn/quiz.utils";
import { QuizOption } from "./QuizOption";

type QuizQuestionCardProps = {
  index: number;
  onAnswerSelect: (questionId: string, answer: string | number) => void;
  question: QuizQuestion;
  selectedAnswer?: string | number;
  showResults: boolean;
};

export function QuizQuestionCard({
  index,
  onAnswerSelect,
  question,
  selectedAnswer,
  showResults,
}: QuizQuestionCardProps) {
  const isCorrect = selectedAnswer !== undefined && isQuizAnswerCorrect(question, selectedAnswer);
  const showExplanation = showResults && selectedAnswer !== undefined;

  return (
    <div className={`relative rounded-lg border transition-colors ${
      showResults
        ? isCorrect
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-red-500/30 bg-red-500/5"
        : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02]"
    }`}>
      <div className="px-4 py-3 border-b border-gray-200 dark:border-white/5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <span className="w-6 h-6 rounded-md bg-gray-200 dark:bg-white/5 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-white/50 flex-shrink-0">
            {index + 1}
          </span>
          <p className="text-sm text-gray-900 dark:text-white leading-relaxed flex-1">{question.question}</p>
        </div>
        {question.points && (
          <span className="text-[10px] text-gray-400 dark:text-white/30 px-2 py-0.5 bg-gray-100 dark:bg-white/5 rounded flex-shrink-0">
            {question.points} pt{question.points > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="p-3 space-y-1.5">
        {question.options.map((option, optionIndex) => (
          <QuizOption key={`${question.id}-${optionIndex}`} onAnswerSelect={onAnswerSelect} option={option} optionIndex={optionIndex} question={question} selectedAnswer={selectedAnswer} showResults={showResults} />
        ))}
      </div>
      {showExplanation && question.explanation && isCorrect && (
        <div className="mx-3 mb-3 px-3 py-2 rounded-md text-xs bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
          <span className="font-medium text-emerald-700 dark:text-emerald-400">✓ Correcto</span>
          <p className="text-gray-700 dark:text-white/60 mt-1 leading-relaxed">
            {parseQuizExplanation(question, selectedAnswer)}
          </p>
        </div>
      )}
    </div>
  );
}
