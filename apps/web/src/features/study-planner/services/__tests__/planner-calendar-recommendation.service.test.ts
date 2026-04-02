import { describe, expect, it } from 'vitest';
import {
  buildStudyPlannerAudioSummary,
  buildStudyPlannerCalendarRecommendationMessage,
  buildStudyPlannerLessonDistribution,
} from '../planner-calendar-recommendation.service';
import type { StudyPlannerCalendarFreeSlotWithDay } from '../../types/planner-schedule.types';
import type { StudyPlannerPendingLesson } from '../../types/planner-ui.types';

function makeSlot(
  date: Date,
  durationMinutes: number,
  dayName = 'Lunes',
): StudyPlannerCalendarFreeSlotWithDay {
  const end = new Date(date.getTime() + durationMinutes * 60000);
  const dateStr = date.toISOString().slice(0, 10);

  return {
    date,
    dateStr,
    dayName,
    durationMinutes,
    end,
    start: date,
  };
}

function makeLesson(
  lessonId: string,
  lessonTitle: string,
  lessonOrderIndex: number,
): StudyPlannerPendingLesson {
  return {
    courseId: 'course-1',
    courseTitle: 'Curso principal',
    durationMinutes: 30,
    lessonId,
    lessonOrderIndex,
    lessonTitle,
    moduleOrderIndex: 0,
    moduleTitle: 'Modulo 1',
  };
}

describe('planner-calendar-recommendation.service', () => {
  it('distributes pending lessons across slots and counts slots after the target date', () => {
    const firstSlot = makeSlot(new Date(2026, 3, 6, 9, 0), 60);
    const secondSlot = makeSlot(new Date(2026, 3, 7, 9, 0), 45, 'Martes');
    const pendingLessons = [
      makeLesson('lesson-1', 'Introduccion al curso', 1),
      makeLesson('lesson-2', 'Practica guiada', 2),
      makeLesson('lesson-3', 'Caso aplicado', 3),
    ];

    const result = buildStudyPlannerLessonDistribution({
      approach: 'balance',
      finalSlots: [firstSlot, secondSlot],
      pendingLessons,
      targetDateObj: new Date(2026, 3, 6),
    });

    expect(result.totalPendingLessons).toBe(3);
    expect(result.storedDistribution).toHaveLength(2);
    expect(result.storedDistribution[0].lessons).toHaveLength(2);
    expect(result.storedDistribution[1].lessons).toHaveLength(1);
    expect(result.slotsAfterTarget).toBe(1);
  });

  it('builds the no-events message using the user profile context', () => {
    const message = buildStudyPlannerCalendarRecommendationMessage({
      busiestDays: [],
      calendarEventsCount: 0,
      distributionResult: {
        computedDistribution: [],
        slotsAfterTarget: 0,
        storedDistribution: [],
        totalPendingLessons: 0,
      },
      effectiveApproach: 'balance',
      effectiveTargetDate: '10 de abril de 2026',
      finalSlots: [],
      profileAvailability: null,
      provider: 'google',
      userProfile: {
        organization: { name: 'SofLIA Labs' },
        professionalProfile: {
          area: { nombre: 'Producto' },
          rol: { nombre: 'Manager' },
        },
        userType: 'b2b',
      },
    });

    expect(message).toContain('trabajas en SofLIA Labs');
    expect(message).toContain('Manager');
    expect(message).toContain('¿Que dias de la semana prefieres estudiar?');
  });

  it('builds an audio summary based on the first recommended slot', () => {
    const summary = buildStudyPlannerAudioSummary({
      calendarEventsCount: 3,
      daysWithFreeTime: [{ dayName: 'Lunes' }],
      finalSlots: [makeSlot(new Date(2026, 3, 6, 9, 30), 60)],
    });

    expect(summary).toContain('Lunes');
    expect(summary).toContain('09:30');
  });
});
