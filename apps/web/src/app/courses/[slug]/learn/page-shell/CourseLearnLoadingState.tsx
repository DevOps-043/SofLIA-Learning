interface CourseLearnLoadingStateProps {
  isMounted: boolean;
  isReady: boolean;
  t: (key: string) => string;
}

export function CourseLearnLoadingState({
  isMounted,
  isReady,
  t,
}: CourseLearnLoadingStateProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1419] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#00D4B3]/20 border-t-[#00D4B3] rounded-full animate-spin mx-auto mb-4" />
        <p
          className="text-[#0A2540] dark:text-white text-lg"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
        >
          {isMounted && isReady ? t('loading.general') : 'Cargando...'}
        </p>
      </div>
    </div>
  );
}
