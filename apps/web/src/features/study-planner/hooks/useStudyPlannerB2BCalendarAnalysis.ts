import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type {
  StudyApproach,
  StudyPlannerAssignedCourse,
  StudyPlannerMessage,
  StudyPlannerPendingLesson,
} from '../types/planner-ui.types';

interface StudyPlannerB2BProfile {
  organization?: {
    name?: string | null;
  };
  professionalProfile?: {
    area?: { nombre?: string | null };
    nivel?: { nombre?: string | null };
    rol?: { nombre?: string | null };
  };
}

interface StudyPlannerMetadataLesson {
  durationSeconds?: number;
  lessonId: string;
  lessonOrderIndex?: number;
  lessonTitle?: string;
  totalDurationMinutes?: number;
}

interface StudyPlannerMetadataModule {
  lessons?: StudyPlannerMetadataLesson[];
  moduleOrderIndex?: number;
  moduleTitle?: string;
}

interface StudyPlannerCourseAnalysis {
  completedLessons: number;
  courseId: string;
  daysUntilDeadline: number;
  dueDate: string;
  dueDateObj: Date;
  pendingLessons: number;
  pendingLessonsDetails: Array<{
    durationMinutes: number;
    lessonId: string;
    lessonOrderIndex: number;
    lessonTitle: string;
    moduleOrderIndex: number;
    moduleTitle: string;
  }>;
  title: string;
  totalLessons: number;
  weeksUntilDeadline: number;
}

interface UseStudyPlannerB2BCalendarAnalysisParams {
  analyzeCalendarAndSuggest: (
    provider: string,
    effectiveTargetDate?: string,
    effectiveApproach?: StudyApproach,
    skipB2BRedirect?: boolean,
  ) => Promise<void>;
  pendingLessonsRef: MutableRefObject<StudyPlannerPendingLesson[]>;
  selectedCourseIds: string[];
  setConversationHistory: Dispatch<SetStateAction<StudyPlannerMessage[]>>;
  setIsProcessing: Dispatch<SetStateAction<boolean>>;
  setPendingLessonsWithNames: Dispatch<SetStateAction<StudyPlannerPendingLesson[]>>;
  setSelectedCourseIds: Dispatch<SetStateAction<string[]>>;
  setTargetDate: Dispatch<SetStateAction<string | null>>;
}

function resolveB2BDeadlineWindow(
  approach: StudyApproach,
  assignedCourses: StudyPlannerAssignedCourse[],
) {
  const allDueDates = assignedCourses
    .map((course) => course.dueDate)
    .filter((dueDate): dueDate is string => Boolean(dueDate))
    .map((dueDate) => new Date(dueDate))
    .sort((left, right) => right.getTime() - left.getTime());

  let furthestDueDate = allDueDates[0];
  let nearestDueDate = allDueDates[allDueDates.length - 1];

  if (!furthestDueDate) {
    const weeksToAdd = approach === 'corto' ? 2 : approach === 'balance' ? 4 : 8;
    furthestDueDate = new Date();
    furthestDueDate.setDate(furthestDueDate.getDate() + weeksToAdd * 7);
    nearestDueDate = furthestDueDate;
  }

  return {
    furthestDueDate,
    nearestDueDate,
  };
}

async function resolveCourseAnalysis(
  course: StudyPlannerAssignedCourse,
  fallbackDueDate: Date,
): Promise<StudyPlannerCourseAnalysis> {
  const courseDueDate = course.dueDate ? new Date(course.dueDate) : fallbackDueDate;
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const daysUntilDeadline = Math.ceil(
    (courseDueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const weeksUntilDeadline = Math.ceil(daysUntilDeadline / 7);

  let totalLessons = 0;
  let completedLessons = 0;
  let pendingLessonsDetails: StudyPlannerCourseAnalysis['pendingLessonsDetails'] = [];

  try {
    const metadataResponse = await fetch(`/api/workshops/${course.courseId}/metadata`);

    if (metadataResponse.ok) {
      const metadataData = (await metadataResponse.json()) as {
        metadata?: { modules?: StudyPlannerMetadataModule[] };
        modules?: StudyPlannerMetadataModule[];
      };
      const modules = metadataData.metadata?.modules || metadataData.modules || [];

      if (modules.length > 0) {
        const allLessons = modules.flatMap((module) =>
          (module.lessons || []).map((lesson) => ({
            lessonId: lesson.lessonId,
            lessonTitle: lesson.lessonTitle,
          })),
        );

        const uniqueLessonsMap = new Map<string, { lessonId: string; lessonTitle?: string }>();
        allLessons.forEach((lesson) => {
          if (lesson.lessonId && !uniqueLessonsMap.has(lesson.lessonId)) {
            uniqueLessonsMap.set(lesson.lessonId, lesson);
          }
        });

        totalLessons = Array.from(uniqueLessonsMap.values()).length;

        let completedLessonIds: string[] = [];
        try {
          const progressResponse = await fetch(
            `/api/study-planner/course-progress?courseId=${course.courseId}`,
          );

          if (progressResponse.ok) {
            const progressData = (await progressResponse.json()) as {
              completedLessonIds?: string[];
            };
            completedLessonIds = progressData.completedLessonIds || [];
            completedLessons = completedLessonIds.length;
          }
        } catch (progressError) {
          console.warn(
            `[B2B] Error obteniendo progreso del curso ${course.courseId}:`,
            progressError,
          );
        }

        const completedSet = new Set(completedLessonIds);

        modules.forEach((module, moduleIndex) => {
          (module.lessons || []).forEach((lesson, lessonIndex) => {
            if (!completedSet.has(lesson.lessonId)) {
              pendingLessonsDetails.push({
                lessonId: lesson.lessonId,
                lessonTitle: lesson.lessonTitle || `Leccion ${lessonIndex + 1}`,
                moduleTitle: module.moduleTitle || `Modulo ${moduleIndex + 1}`,
                moduleOrderIndex: module.moduleOrderIndex || moduleIndex,
                lessonOrderIndex: lesson.lessonOrderIndex || lessonIndex,
                durationMinutes:
                  lesson.totalDurationMinutes && lesson.totalDurationMinutes > 0
                    ? lesson.totalDurationMinutes
                    : lesson.durationSeconds && lesson.durationSeconds > 0
                      ? Math.ceil(lesson.durationSeconds / 60)
                      : 15,
              });
            }
          });
        });

        pendingLessonsDetails = pendingLessonsDetails.sort((left, right) => {
          if (left.moduleOrderIndex !== right.moduleOrderIndex) {
            return left.moduleOrderIndex - right.moduleOrderIndex;
          }

          return left.lessonOrderIndex - right.lessonOrderIndex;
        });
      }
    }
  } catch (metadataError) {
    console.warn(`[B2B] Error obteniendo lecciones del curso ${course.courseId}:`, metadataError);
  }

  const pendingLessons = totalLessons - completedLessons;

  return {
    courseId: course.courseId,
    title: course.title,
    dueDate: course.dueDate || courseDueDate.toISOString(),
    dueDateObj: courseDueDate,
    daysUntilDeadline,
    weeksUntilDeadline,
    totalLessons,
    completedLessons,
    pendingLessons,
    pendingLessonsDetails,
  };
}

export function useStudyPlannerB2BCalendarAnalysis(
  params: UseStudyPlannerB2BCalendarAnalysisParams,
) {
  const analyzeCalendarAndSuggestB2B = async (
    provider: string,
    approach: StudyApproach,
    userProfile: StudyPlannerB2BProfile,
    assignedCourses: StudyPlannerAssignedCourse[],
  ) => {
    params.setIsProcessing(true);

    try {
      const { furthestDueDate, nearestDueDate } = resolveB2BDeadlineWindow(
        approach,
        assignedCourses,
      );

      const courseAnalysis = await Promise.all(
        assignedCourses.map((course) => resolveCourseAnalysis(course, furthestDueDate)),
      );

      const allPendingLessons: StudyPlannerPendingLesson[] = [];
      courseAnalysis.forEach((courseInfo) => {
        courseInfo.pendingLessonsDetails.forEach((lesson) => {
          allPendingLessons.push({
            courseId: courseInfo.courseId,
            courseTitle: courseInfo.title,
            lessonId: lesson.lessonId,
            lessonTitle: lesson.lessonTitle,
            moduleTitle: lesson.moduleTitle,
            moduleOrderIndex: lesson.moduleOrderIndex,
            lessonOrderIndex: lesson.lessonOrderIndex,
            durationMinutes: lesson.durationMinutes,
          });
        });
      });

      allPendingLessons.sort((left, right) => {
        if (left.moduleOrderIndex !== right.moduleOrderIndex) {
          return left.moduleOrderIndex - right.moduleOrderIndex;
        }

        return left.lessonOrderIndex - right.lessonOrderIndex;
      });

      params.setPendingLessonsWithNames(allPendingLessons);
      params.pendingLessonsRef.current = allPendingLessons;

      const originalSelectedCourseIds = params.selectedCourseIds;
      const b2bCourseIds = courseAnalysis.map((course) => course.courseId);
      params.setSelectedCourseIds(b2bCourseIds);

      const nearestDueDateFormatted = nearestDueDate.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      params.setTargetDate(nearestDueDateFormatted);

      try {
        await params.analyzeCalendarAndSuggest(
          provider,
          nearestDueDateFormatted,
          approach,
          true,
        );
      } finally {
        params.setIsProcessing(false);
      }

      params.setSelectedCourseIds(originalSelectedCourseIds);
    } catch (error) {
      console.error('[B2B] Error en analisis de calendario:', error);
      params.setIsProcessing(false);

      const organizationName = userProfile.organization?.name;
      const manualFallbackMessage = organizationName
        ? `Tu calendario esta conectado, pero no pude completar el analisis automatico para ${organizationName}. No te preocupes, podemos continuar de forma manual. ¿Que dias de la semana prefieres estudiar y en que horario te concentras mejor?`
        : 'Tu calendario esta conectado, pero no pude completar el analisis automatico. No te preocupes, podemos continuar de forma manual. ¿Que dias de la semana prefieres estudiar y en que horario te concentras mejor?';

      params.setConversationHistory((previousHistory) => [
        ...previousHistory,
        { role: 'assistant', content: manualFallbackMessage },
      ]);
    }
  };

  return {
    analyzeCalendarAndSuggestB2B,
  };
}
