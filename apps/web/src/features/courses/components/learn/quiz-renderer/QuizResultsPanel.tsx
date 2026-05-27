import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface QuizResultsPanelProps {
  onRequestFeedback?: () => void;
  onRetry: () => void;
  passed: boolean;
  passingThreshold: number;
  percentage: number;
  pointsEarned: number;
  score: number;
  serverMessage: string | null;
  totalPoints?: number;
  totalQuestions: number;
}

export function QuizResultsPanel({
  onRequestFeedback,
  onRetry,
  passed,
  passingThreshold,
  percentage,
  pointsEarned,
  score,
  serverMessage,
  totalPoints,
  totalQuestions,
}: QuizResultsPanelProps) {
  const { t } = useTranslation("learn");

  return (
    <div
      className={`rounded-lg border p-5 ${
        passed
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-red-500/30 bg-red-500/5"
      }`}
    >
      {serverMessage && (
        <div className="mb-4 rounded-md border border-gray-200 bg-gray-100 px-3 py-2 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs text-gray-600 dark:text-white/60">{serverMessage}</p>
        </div>
      )}
      <div className="text-center">
        <p
          className={`mb-1 text-lg font-bold ${
            passed
              ? "text-emerald-500 dark:text-emerald-400"
              : "text-red-500 dark:text-red-400"
          }`}
        >
          {passed
            ? t("activities.quiz.resultPassed")
            : t("activities.quiz.resultFailed")}
        </p>
        <p className="mb-1 text-sm font-medium text-gray-800 dark:text-white">
          {t("activities.quiz.correctCount", { score, total: totalQuestions })}
        </p>
        {totalPoints !== undefined && (
          <p className="mb-1 text-xs text-gray-500 dark:text-white/60">
            {t("activities.quiz.pointsEarned", {
              earned: pointsEarned,
              total: totalPoints,
            })}
          </p>
        )}
        <p className="text-xs text-gray-400 dark:text-white/40">
          {t("activities.quiz.requiredScore", {
            percentage,
            threshold: passingThreshold,
          })}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {onRequestFeedback && (
          <button
            onClick={onRequestFeedback}
            className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-primary/90"
            type="button"
          >
            {t("activities.quizFeedback.open")}
          </button>
        )}
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-md bg-gray-200 px-4 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/15"
          type="button"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t("activities.quiz.retry")}
        </button>
      </div>
    </div>
  );
}
