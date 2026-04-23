import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic';

interface CourseNotFoundStateProps {
  logic: Pick<LearnPageLogicResult, 'router' | 't'>;
}

export function CourseNotFoundState({ logic }: CourseNotFoundStateProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1419] flex items-center justify-center">
      <div className="text-center">
        <h1
          className="text-3xl font-bold text-[#0A2540] dark:text-white mb-4"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
        >
          {logic.t('errors.courseNotFound')}
        </h1>
        <p
          className="text-[#6C757D] dark:text-white/80 mb-8"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
        >
          {logic.t('errors.courseNotFoundMessage')}
        </p>
        <button
          className="px-6 py-3 bg-[#0A2540] hover:bg-[#0d2f4d] text-white rounded-lg transition-colors"
          onClick={() => logic.router.push('/dashboard')}
        >
          {logic.t('navigation.backToCourses')}
        </button>
      </div>
    </div>
  );
}
