import { Loader2 } from "lucide-react";
import type { SelectedQuizAnswers } from "../quiz.utils";

interface QuizSubmitActionsProps {
  isSubmitting: boolean;
  onSubmit: () => void;
  selectedAnswers: SelectedQuizAnswers;
  showResults: boolean;
  totalQuestions: number;
}

export function QuizSubmitActions({
  isSubmitting,
  onSubmit,
  selectedAnswers,
  showResults,
  totalQuestions,
}: QuizSubmitActionsProps) {
  if (showResults) {
    return null;
  }

  return (
    <div className="flex justify-end pt-3 border-t border-white/5">
      <button
        onClick={onSubmit}
        disabled={Object.keys(selectedAnswers).length < totalQuestions || isSubmitting}
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
  );
}
