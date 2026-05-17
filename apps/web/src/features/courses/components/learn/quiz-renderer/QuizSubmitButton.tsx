import { Loader2 } from "lucide-react";

interface QuizSubmitButtonProps {
  isSubmitting: boolean;
  onSubmit: () => void;
  selectedAnswerCount: number;
  totalQuestions: number;
}

export function QuizSubmitButton({
  isSubmitting,
  onSubmit,
  selectedAnswerCount,
  totalQuestions,
}: QuizSubmitButtonProps) {
  return (
    <div className="flex justify-end pt-3 border-t border-white/5">
      <button
        onClick={onSubmit}
        disabled={selectedAnswerCount < totalQuestions || isSubmitting}
        className="px-4 py-2 rounded-md text-sm font-medium bg-primary hover:bg-primary/90 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
