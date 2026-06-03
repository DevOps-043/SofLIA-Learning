import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface QuizSubmitButtonProps {
  isSubmitting: boolean;
  onSubmit: () => void;
  selectedAnswerCount: number;
  totalQuestions: number;
  noBorder?: boolean;
}

export function QuizSubmitButton({
  isSubmitting,
  onSubmit,
  selectedAnswerCount,
  totalQuestions,
  noBorder = false,
}: QuizSubmitButtonProps) {
  const { t } = useTranslation("learn");

  return (
    <div className={noBorder ? "flex justify-end" : "flex justify-end pt-3 border-t border-gray-200 dark:border-white/5"}>
      <button
        onClick={onSubmit}
        disabled={selectedAnswerCount < totalQuestions || isSubmitting}
        className="px-4 py-2 rounded-md text-sm font-medium bg-primary hover:bg-primary/90 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {t("activities.quiz.saving")}
          </>
        ) : (
          t("activities.quiz.submit")
        )}
      </button>
    </div>
  );
}
