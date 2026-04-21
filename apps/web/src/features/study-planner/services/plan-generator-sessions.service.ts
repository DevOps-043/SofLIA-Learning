import { LessonTimeService } from './lesson-time.service';
import { StudyStrategyService, type StudyMode } from './study-strategy.service';
import type { StudyPlanConfig, PlannedSession, SessionBreak } from './plan-generator.types';

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

export function calculateEndTime(startHour: number, startMinute: number, durationMinutes: number): string {
  const total = startHour * 60 + startMinute + durationMinutes;
  return formatTime(Math.floor(total / 60) % 24, total % 60);
}

export async function generatePlanSessions(config: StudyPlanConfig): Promise<PlannedSession[]> {
  const sessions: PlannedSession[] = [];
  const timeAnalysis = await LessonTimeService.analyzeCoursesTime(config.selectedCourseIds);
  const orderedCourses = config.learningRoute.items.sort((a, b) => a.order - b.order);

  const studyMode: StudyMode = config.studyMode || 'balanced';
  const maxConsecutiveHours = config.maxConsecutiveHours || 2;
  const maxDailyMinutes = maxConsecutiveHours * 60;
  const maxSessions = 365 * config.selectedDays.length;

  let currentDate = new Date(config.startDate);
  let sessionCount = 0;
  let courseIndex = 0;
  let lessonIndex = 0;
  let dailyStudyMinutes = 0;
  let lastSessionDate: string | null = null;

  while (courseIndex < orderedCourses.length && sessionCount < maxSessions) {
    const currentCourse = orderedCourses[courseIndex];
    const courseTime = timeAnalysis.courses.find((c) => c.courseId === currentCourse.courseId);

    if (!courseTime || lessonIndex >= courseTime.lessons.length) {
      courseIndex++;
      lessonIndex = 0;
      continue;
    }

    const dayName = DAY_NAMES[currentDate.getDay()];
    const currentDateStr = currentDate.toDateString();

    if (lastSessionDate !== currentDateStr) {
      dailyStudyMinutes = 0;
      lastSessionDate = currentDateStr;
    }

    if (config.selectedDays.includes(dayName)) {
      const timeBlock = config.timeBlocks.find((tb) => tb.day === dayName);

      if (timeBlock) {
        const currentLesson = courseTime.lessons[lessonIndex];
        const sessionDuration = Math.min(Math.max(Math.ceil(currentLesson.totalMinutes), config.minSessionMinutes), config.maxSessionMinutes);

        if (dailyStudyMinutes + sessionDuration > maxDailyMinutes) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        const breakdownResult = StudyStrategyService.calculateBreaks(sessionDuration, studyMode);
        const breaks: SessionBreak[] = breakdownResult.breaks.map((b) => ({ afterMinutes: b.afterMinutes, durationMinutes: b.durationMinutes }));

        sessions.push({
          id: `session-${sessionCount + 1}`,
          date: new Date(currentDate),
          dayOfWeek: dayName,
          startTime: formatTime(timeBlock.startHour, timeBlock.startMinute || 0),
          endTime: calculateEndTime(timeBlock.startHour, timeBlock.startMinute || 0, breakdownResult.totalMinutes),
          durationMinutes: sessionDuration,
          courseId: currentCourse.courseId,
          courseTitle: currentCourse.title,
          lessonId: currentLesson.lessonId,
          lessonTitle: currentLesson.lessonTitle,
          breaks,
          status: 'planned',
          studyMode,
          pomodoroCount: breakdownResult.pomodoroCount || 0,
          hasIntegratedBreaks: breaks.length > 0,
          integratedBreakMinutes: breakdownResult.breakMinutes,
        });

        sessionCount++;
        lessonIndex++;
        dailyStudyMinutes += sessionDuration;
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
    if (config.targetEndDate && currentDate > config.targetEndDate) break;
  }

  return sessions;
}
