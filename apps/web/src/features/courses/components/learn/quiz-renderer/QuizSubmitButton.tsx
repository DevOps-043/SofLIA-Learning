import { CheckCheck, Loader2 } from "lucide-react";
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
    <div className={noBorder ? "flex justify-end" : "flex justify-end border-t border-gray-200/70 pt-3 dark:border-white/10"}>
      <button
        onClick={onSubmit}
        disabled={selectedAnswerCount < totalQuestions || isSubmitting}
        className="flex min-h-10 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
        style={{ backgroundColor: 'var(--learn-action)', borderColor: 'color-mix(in srgb, var(--learn-action) 28%, transparent)', color: 'var(--learn-on-action)', boxShadow: '0 0.55rem 1.25rem color-mix(in srgb, var(--learn-action) 14%, transparent)' }}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {t("activities.quiz.saving")}
          </>
        ) : (
          <>
            <CheckCheck className="h-4 w-4" />
            {t("activities.quiz.submit")}
          </>
        )}
      </button>
    </div>
  );
}
