import { RefreshCw } from "lucide-react";

interface QuizResultsPanelProps {
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
  return (
    <div className={`rounded-lg border p-5 ${passed ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
      {serverMessage && (
        <div className="mb-4 px-3 py-2 rounded-md bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
          <p className="text-gray-600 dark:text-white/60 text-xs">{serverMessage}</p>
        </div>
      )}
      <div className="text-center">
        <p className={`text-lg font-semibold mb-1 ${passed ? "text-emerald-500 font-bold dark:text-emerald-400" : "text-red-500 font-bold dark:text-red-400"}`}>
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
      <div className="flex justify-center mt-4">
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-md text-xs font-medium bg-gray-200 hover:bg-gray-300 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-white/70 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reintentar
        </button>
      </div>
    </div>
  );
}
