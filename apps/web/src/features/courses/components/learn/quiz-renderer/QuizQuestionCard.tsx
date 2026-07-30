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
  // Sin clave de respuestas (carga inicial / hidratación) mostramos estado neutro.
  const answerKeyKnown = question.correctAnswer !== undefined && question.correctAnswer !== "";
  const isCorrect = answerKeyKnown && selectedAnswer !== undefined && isQuizAnswerCorrect(question, selectedAnswer);
  const showGrading = showResults && answerKeyKnown;
  const showExplanation = showGrading && selectedAnswer !== undefined;

  return (
    <div className={`relative overflow-hidden rounded-2xl border shadow-[0_0.5rem_1.5rem_rgb(15_23_42_/_0.035)] transition-colors ${
      showGrading
        ? isCorrect
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-red-500/30 bg-red-500/5"
        : "border-gray-200/80 bg-white/75 dark:border-white/10 dark:bg-white/[0.025]"
    }`}>
      <div className="flex items-start justify-between gap-3 border-b border-gray-200/70 px-4 py-4 dark:border-white/10 sm:px-5">
        <div className="flex items-start gap-3 flex-1">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[0.65rem] border text-xs font-semibold" style={{ color: 'var(--learn-accent)', borderColor: 'color-mix(in srgb, var(--learn-accent) 18%, transparent)', backgroundColor: 'color-mix(in srgb, var(--learn-accent) 7%, transparent)' }}>
            {index + 1}
          </span>
          <p className="flex-1 text-sm font-medium leading-relaxed text-gray-900 dark:text-white">{question.question}</p>
        </div>
        {question.points && (
          <span className="flex-shrink-0 rounded-full border border-gray-200/80 bg-gray-100/70 px-2 py-1 text-[10px] text-gray-400 dark:border-white/10 dark:bg-white/5 dark:text-white/35">
            {question.points} pt{question.points > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="space-y-2 p-3 sm:p-4">
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
