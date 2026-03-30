import type { StudyPlannerCourseOption } from '../types/planner-ui.types';

type JsonRecord = Record<string, unknown>;

export interface StudyPlannerWeeklyGoalCourse {
  courseId: string;
  courseTitle: string;
  lessonsToComplete: number;
  topicsToLearn: string[];
}

export interface StudyPlannerWeeklyGoals {
  lessonsPerWeek: number;
  hoursPerWeek: number;
  learningObjectives: string[];
  coursesInfo: StudyPlannerWeeklyGoalCourse[];
}

interface WeeklyGoalCourseMetrics {
  courseId: string;
  courseTitle: string;
  totalLessons: number;
  totalDurationMinutes: number;
  lessonTitles: string[];
}

interface WeeklyGoalInput {
  selectedCourseIds: string[];
  weeklyAvailableMinutes: number;
  recommendedSessionLength: number;
  weeksUntilTarget?: number;
  totalLessonsNeeded?: number;
  availableCourses: StudyPlannerCourseOption[];
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : null;
}

function asRecordArray(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.map(item => asRecord(item)).filter((item): item is JsonRecord => item !== null) : [];
}

function readString(record: JsonRecord, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return null;
}

function readNumber(record: JsonRecord, ...keys: string[]): number {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return 0;
}

async function fetchCourseMetrics(
  courseId: string,
  availableCourses: StudyPlannerCourseOption[],
): Promise<WeeklyGoalCourseMetrics> {
  const courseFromList = availableCourses.find(course => course.id === courseId);
  const fallbackTitle = courseFromList?.title || 'Curso';

  try {
    let courseSlug: string | null = null;
    let allLessons: JsonRecord[] = [];

    const myCoursesResponse = await fetch('/api/my-courses');
    if (myCoursesResponse.ok) {
      const myCoursesData = await myCoursesResponse.json() as unknown;
      const topLevelCourses = asRecordArray(myCoursesData);
      const nestedCourses = asRecord(myCoursesData)?.courses;
      const courses = topLevelCourses.length > 0 ? topLevelCourses : asRecordArray(nestedCourses);
      const courseData = courses.find(course => readString(course, 'course_id', 'id') === courseId);

      if (courseData) {
        const nestedCourse = asRecord(courseData.courses);
        courseSlug = readString(nestedCourse || {}, 'slug') || readString(courseData, 'slug');

        if (courseSlug) {
          const modulesResponse = await fetch(`/api/courses/${courseSlug}/modules`);
          if (modulesResponse.ok) {
            const modulesData = await modulesResponse.json() as unknown;
            const modules = asRecordArray(asRecord(modulesData)?.modules);
            allLessons = modules.flatMap(module => asRecordArray(module.lessons));
          }
        }
      }
    }

    const normalizedLessons = allLessons
      .map((lesson) => {
        const lessonId = readString(lesson, 'lesson_id', 'lessonId');
        const lessonTitle = readString(lesson, 'lesson_title', 'lessonTitle') || '';
        const lessonOrderIndex = readNumber(lesson, 'lesson_order_index', 'lessonOrderIndex');
        const durationSeconds = readNumber(lesson, 'duration_seconds', 'durationSeconds');
        const totalDurationMinutes = readNumber(lesson, 'total_duration_minutes', 'totalDurationMinutes');
        const isPublished = lesson.is_published !== false;

        return {
          lessonId,
          lessonTitle,
          lessonOrderIndex,
          durationSeconds,
          totalDurationMinutes: totalDurationMinutes > 0
            ? totalDurationMinutes
            : durationSeconds > 0
              ? Math.ceil(durationSeconds / 60)
              : 15,
          isPublished,
        };
      })
      .filter(lesson => lesson.lessonId && lesson.lessonTitle && lesson.isPublished);

    const totalDurationMinutes = normalizedLessons.length > 0
      ? normalizedLessons.reduce((sum, lesson) => sum + lesson.totalDurationMinutes, 0)
      : 300;

    return {
      courseId,
      courseTitle: fallbackTitle,
      totalLessons: normalizedLessons.length > 0 ? normalizedLessons.length : 10,
      totalDurationMinutes,
      lessonTitles: normalizedLessons
        .slice(0, 10)
        .map(lesson => lesson.lessonTitle)
        .filter(title => title.trim() !== ''),
    };
  } catch (error) {
    console.error(`Error obteniendo informacion del curso ${courseId}:`, error);
    return {
      courseId,
      courseTitle: fallbackTitle,
      totalLessons: 10,
      totalDurationMinutes: 300,
      lessonTitles: [],
    };
  }
}

export async function calculateStudyPlannerWeeklyGoals(
  input: WeeklyGoalInput,
): Promise<StudyPlannerWeeklyGoals | null> {
  const {
    selectedCourseIds,
    weeklyAvailableMinutes,
    recommendedSessionLength,
    weeksUntilTarget = 4,
    totalLessonsNeeded = 0,
    availableCourses,
  } = input;

  if (selectedCourseIds.length === 0 || weeklyAvailableMinutes === 0) {
    return null;
  }

  try {
    const validCourses = await Promise.all(
      selectedCourseIds.map(courseId => fetchCourseMetrics(courseId, availableCourses)),
    );

    if (validCourses.length === 0) {
      return null;
    }

    const coursesWithLessonTime = validCourses.map(course => {
      const averageLessonMinutes = course.totalLessons > 0 && course.totalDurationMinutes > 0
        ? course.totalDurationMinutes / course.totalLessons
        : recommendedSessionLength;

      return {
        ...course,
        effectiveLessonTime: Math.max(averageLessonMinutes * 1.5, recommendedSessionLength),
      };
    });

    const totalLessons = totalLessonsNeeded > 0
      ? totalLessonsNeeded
      : validCourses.reduce((sum, course) => sum + course.totalLessons, 0);

    const coursesInfo: StudyPlannerWeeklyGoalCourse[] = weeksUntilTarget > 0 && totalLessons > 0
      ? coursesWithLessonTime.map(course => {
        const courseProportion = totalLessons > 0 ? (course.totalLessons / totalLessons) : (1 / validCourses.length);
        const lessonsForThisCourse = Math.max(1, Math.ceil(Math.ceil(totalLessons / weeksUntilTarget) * courseProportion));
        return {
          courseId: course.courseId,
          courseTitle: course.courseTitle,
          lessonsToComplete: Math.min(lessonsForThisCourse, course.totalLessons || 999),
          topicsToLearn: course.lessonTitles.slice(0, 3).filter(Boolean),
        };
      })
      : coursesWithLessonTime.map(course => {
        const lessonsForThisCourse = Math.floor((weeklyAvailableMinutes / validCourses.length) / course.effectiveLessonTime);
        return {
          courseId: course.courseId,
          courseTitle: course.courseTitle,
          lessonsToComplete: Math.min(Math.max(1, lessonsForThisCourse), course.totalLessons || 999),
          topicsToLearn: course.lessonTitles.slice(0, 3).filter(Boolean),
        };
      });

    const totalLessonsPerWeek = coursesInfo.reduce((sum, course) => sum + course.lessonsToComplete, 0);
    const hoursPerWeek = weeksUntilTarget > 0 && totalLessons > 0
      ? Math.round(((totalLessonsPerWeek * (coursesWithLessonTime.reduce((sum, course) => sum + course.effectiveLessonTime, 0) / coursesWithLessonTime.length)) / 60) * 10) / 10
      : Math.round((weeklyAvailableMinutes / 60) * 10) / 10;

    return {
      lessonsPerWeek: Math.max(1, totalLessonsPerWeek),
      hoursPerWeek,
      learningObjectives: validCourses.flatMap(course => course.lessonTitles).slice(0, 5).filter(Boolean),
      coursesInfo,
    };
  } catch (error) {
    console.error('Error calculando metas semanales:', error);
    return null;
  }
}
