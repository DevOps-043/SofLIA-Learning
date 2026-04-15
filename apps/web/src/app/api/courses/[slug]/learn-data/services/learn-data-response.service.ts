import type { LearnDataQueryPayload } from './learn-data-query.service'

export function buildLearnDataResponse({
  course,
  modulesResult,
  lessonDataResult,
  notesStatsResult,
  questionsResult,
  totalTimeMs,
}: LearnDataQueryPayload) {
  return {
    course: {
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail_url,
      instructor_id: course.instructor_id,
      category: course.category,
      difficulty_level: course.level,
      price: course.price,
      is_published: course.is_active,
      enrollment_id: modulesResult.enrollmentId,
      organization_id: modulesResult.organizationId,
    },
    modules: modulesResult.modules,
    courseProgress: modulesResult.progress,
    lastWatchedLessonId: modulesResult.lastWatchedLessonId,
    currentLesson: lessonDataResult,
    questions: questionsResult,
    notesStats: notesStatsResult || {
      totalNotes: 0,
      lessonsWithNotes: '0/0',
      lastUpdate: null,
    },
    _meta: {
      timestamp: new Date().toISOString(),
      executionTime: `${totalTimeMs}ms`,
      queriesExecuted: 4,
      optimization: 'unified-endpoint',
    },
  }
}
