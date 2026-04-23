import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic';

interface TranslationFallbackBannerProps {
  warning: LearnPageLogicResult['translationFallbackWarning'];
}

export function TranslationFallbackBanner({
  warning,
}: TranslationFallbackBannerProps) {
  if (!warning) return null;

  return (
    <div className="mx-2 md:mx-4 mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-200">
      <p className="text-sm font-semibold">{warning.title}</p>
      <p className="text-xs">{warning.message}</p>
    </div>
  );
}
