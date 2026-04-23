interface LessonLoadingStateProps {
  t: (key: string) => string;
}

export function LessonLoadingState({ t }: LessonLoadingStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary/30 dark:border-primary/50 border-t-primary dark:border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p
          className="text-[#6C757D] dark:text-white/60"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
        >
          {t('loading.lesson')}
        </p>
      </div>
    </div>
  );
}
