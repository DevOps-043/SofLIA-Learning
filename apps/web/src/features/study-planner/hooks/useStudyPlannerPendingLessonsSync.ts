'use client';

import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';

import type { LessonData } from './useSofLIAData';
import type { StudyPlannerAssignedCourse, StudyPlannerPendingLesson } from '../types/planner-ui.types';

type StateSetter<T> = Dispatch<SetStateAction<T>>;

interface UseStudyPlannerPendingLessonsSyncParams {
  assignedCourses: StudyPlannerAssignedCourse[];
  lessons: LessonData[];
  lessonsAreLoading: boolean;
  lessonsAreReady: boolean;
  lessonsError: string | null;
  loadPendingLessons: () => Promise<void>;
  pendingLessonsRef: MutableRefObject<StudyPlannerPendingLesson[]>;
  setPendingLessonsWithNames: StateSetter<StudyPlannerPendingLesson[]>;
}

function mapLessonToPendingLesson(lesson: LessonData): StudyPlannerPendingLesson {
  return {
    courseId: lesson.courseId,
    courseTitle: lesson.courseTitle,
    durationMinutes: lesson.durationMinutes || 15,
    lessonId: lesson.lessonId,
    lessonOrderIndex: lesson.lessonOrderIndex,
    lessonTitle: lesson.lessonTitle,
    moduleOrderIndex: lesson.moduleOrderIndex,
    moduleTitle: lesson.moduleTitle,
  };
}

export function useStudyPlannerPendingLessonsSync({
  assignedCourses,
  lessons,
  lessonsAreLoading,
  lessonsAreReady,
  lessonsError,
  loadPendingLessons,
  pendingLessonsRef,
  setPendingLessonsWithNames,
}: UseStudyPlannerPendingLessonsSyncParams): void {
  useEffect(() => {
    if (assignedCourses.length > 0 && !lessonsAreReady && !lessonsAreLoading && !lessonsError) {
      void loadPendingLessons();
    }
  }, [assignedCourses, lessonsAreLoading, lessonsAreReady, lessonsError, loadPendingLessons]);

  useEffect(() => {
    if (!lessonsAreReady || lessons.length === 0) {
      return;
    }

    const formattedLessons = lessons.map(mapLessonToPendingLesson);
    if (pendingLessonsRef.current.length !== formattedLessons.length) {
      pendingLessonsRef.current = formattedLessons;
      setPendingLessonsWithNames(formattedLessons);
    }
  }, [lessons, lessonsAreReady, pendingLessonsRef, setPendingLessonsWithNames]);
}
