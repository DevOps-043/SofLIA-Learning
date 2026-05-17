import type { CourseLessonContext } from '../../types/lia.types';

export function buildCurrentLessonContext(
  activeContext: CourseLessonContext | undefined,
  activeTab: string | undefined,
  fallbackCurrentPage: string | undefined
) {
  if (!activeContext) {
    return undefined;
  }

  const activities = activeContext.activitiesContext;
  const materials = activeContext.materialsContext;
  const quiz = activeContext.quizContext;

  return {
    contextType: activeContext.contextType,
    courseId: activeContext.courseId,
    courseSlug: activeContext.courseSlug,
    courseTitle: activeContext.courseTitle,
    courseDescription: activeContext.courseDescription,
    userRole: activeContext.userRole,
    moduleId: activeContext.moduleId,
    moduleTitle: activeContext.moduleTitle,
    lessonId: activeContext.lessonId,
    lessonTitle: activeContext.lessonTitle,
    transcript: activeContext.transcriptContent,
    summary: activeContext.summaryContent,
    description: activeContext.lessonDescription,
    durationSeconds: activeContext.durationSeconds,
    totalDurationMinutes: activeContext.totalDurationMinutes,
    currentTab: activeTab,
    currentPage: fallbackCurrentPage,
    learningProgress: activeContext.learningProgressContext,
    userBehaviorContext: activeContext.userBehaviorContext,
    difficultyDetected: activeContext.difficultyDetected,
    activities: activities
      ? {
          totalActivities: activities.totalActivities,
          requiredActivities: activities.requiredActivities,
          completedActivities: activities.completedActivities,
          pendingRequiredCount: activities.pendingRequiredCount,
          pendingRequiredTitles: activities.pendingRequiredTitles,
          items: activities.activityTypes,
          currentActivityFocus: activities.currentActivityFocus || undefined,
        }
      : undefined,
    materials: materials
      ? {
          totalMaterials: materials.totalMaterials,
          requiredMaterials: materials.requiredMaterials,
          items: materials.materialTypes,
        }
      : undefined,
    quiz: quiz
      ? {
          hasRequiredQuizzes: quiz.hasRequiredQuizzes,
          totalRequiredQuizzes: quiz.totalRequiredQuizzes,
          completedQuizzes: quiz.completedQuizzes,
          passedQuizzes: quiz.passedQuizzes,
          allQuizzesPassed: quiz.allQuizzesPassed,
          quizzes: quiz.quizzes,
        }
      : undefined,
  };
}

export function buildCurrentActivityContext(
  activeContext: CourseLessonContext | undefined
) {
  const activityFocus = activeContext?.activitiesContext?.currentActivityFocus;

  if (!activityFocus) {
    return undefined;
  }

  return {
    title: activityFocus.title,
    type: activityFocus.type,
    description: activityFocus.description,
    prompts: activityFocus.prompts,
  };
}
