import { useTranslation } from "react-i18next";
import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { findQuizAnswerKeyConflict } from "@/lib/course-content";
import type { QuizData, QuizQuestion } from "./types";

export function PendingCourseQuizViewer({ data }: { data: QuizData | null }) {
  const { t } = useTranslation("admin");
  const questions = data?.questions || data?.items;

  if (!data || !questions) {
    return <p className="italic text-gray-400">{t("lessonContent.invalidQuiz")}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-gray-200 pb-2 text-xs text-gray-500 dark:border-gray-700">
        <span>{t("lessonContent.passingScore", { score: data.passing_score })}</span>
        <span>{t("lessonContent.questionCount", { count: questions.length })}</span>
      </div>

      {questions.map((item, index) => (
        <div
          className="rounded border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900/50"
          key={item.id || index}
        >
          <p className="mb-2 font-medium text-gray-800 dark:text-gray-200">
            {index + 1}. {item.question}
          </p>
          <div className="space-y-1 pl-2">
            {item.options?.map((option, optionIndex) => (
              <QuizOption
                correctAnswer={item.correct_answer ?? item.correctAnswer}
                key={optionIndex}
                option={option}
                optionIndex={optionIndex}
              />
            ))}
          </div>
          {item.explanation && (
            <div className="mt-2 rounded bg-blue-50 p-2 text-xs text-blue-600 dark:bg-blue-900/10 dark:text-blue-400">
              <span className="font-bold">{t("lessonContent.explanation")}:</span> {item.explanation}
            </div>
          )}
          <QuizAnswerKeyConflictWarning item={item} />
        </div>
      ))}
    </div>
  );
}

/**
 * Advierte al admin cuando la explicación de la pregunta declara como correcta
 * una opción distinta de la marcada en el answer key (error frecuente del
 * generador de contenido). Debe corregirse antes de publicar el curso.
 */
function QuizAnswerKeyConflictWarning({ item }: { item: QuizQuestion }) {
  const { t } = useTranslation("admin");
  const conflict = findQuizAnswerKeyConflict({
    correctAnswer: item.correct_answer ?? item.correctAnswer,
    explanation: item.explanation,
    options: item.options,
  });

  if (!conflict) {
    return null;
  }

  return (
    <div className="mt-2 flex items-start gap-2 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-700 dark:border-amber-500/40 dark:bg-amber-900/10 dark:text-amber-400">
      <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
      <span>
        {t("lessonContent.answerKeyConflict", {
          declared: conflict.declaredCorrectOption,
          stored: conflict.storedCorrectAnswer,
        })}
      </span>
    </div>
  );
}

interface QuizOptionProps {
  correctAnswer?: number | string;
  option: string;
  optionIndex: number;
}

function QuizOption({ correctAnswer, option, optionIndex }: QuizOptionProps) {
  const isCorrect = (typeof correctAnswer === "number" && correctAnswer === optionIndex) || correctAnswer === option;

  return (
    <div className={`flex items-center gap-2 text-xs ${isCorrect ? "font-medium text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}>
      {isCorrect ? (
        <CheckCircleIcon className="h-4 w-4" />
      ) : (
        <div className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600" />
      )}
      <span>{option}</span>
    </div>
  );
}
