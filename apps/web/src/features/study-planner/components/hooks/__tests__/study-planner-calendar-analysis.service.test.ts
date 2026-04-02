import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createAnalyzeCalendarAndSuggestHandler,
  resolveStudyPlannerEffectiveTargetDate,
} from '../study-planner-calendar-analysis.service';
import type { StudyPlannerAnalyzeCalendarAndSuggestParams } from '../study-planner-calendar-actions.types';
import type {
  StudyPlannerMessage,
  StudyPlannerPendingLesson,
  StudyPlannerUserContext,
} from '../../../types/planner-ui.types';

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function createStateSetter<T>(initialValue: T) {
  let currentValue = initialValue;
  const setter = vi.fn(
    (value: T | ((previousValue: T) => T)) => {
      currentValue = typeof value === 'function' ? value(currentValue) : value;
    },
  );

  return {
    getValue: () => currentValue,
    setter,
  };
}

function createPendingLessonsRef() {
  return {
    current: [] as StudyPlannerPendingLesson[],
  };
}

function createBaseParams(): StudyPlannerAnalyzeCalendarAndSuggestParams {
  const history = createStateSetter<StudyPlannerMessage[]>([]);
  const userContext = createStateSetter<StudyPlannerUserContext | null>(null);

  return {
    analyzeCalendarAndSuggestB2B: vi.fn().mockResolvedValue(undefined),
    availableCourses: [],
    assignedCourses: [],
    isAudioEnabled: false,
    isProcessing: false,
    pendingLessonsRef: createPendingLessonsRef(),
    pendingLessonsWithNames: [],
    selectedCourseIds: [],
    setCalendarSkipped: vi.fn(),
    setConnectedCalendar: vi.fn(),
    setConversationHistory: history.setter,
    setIsConnectingCalendar: vi.fn(),
    setIsProcessing: vi.fn(),
    setPendingLessonsWithNames: vi.fn(),
    setSavedCalendarData: vi.fn(),
    setSavedLessonDistribution: vi.fn(),
    setSavedTargetDate: vi.fn(),
    setSavedTotalLessons: vi.fn(),
    setSelectedCourseIds: vi.fn(),
    setShowCalendarModal: vi.fn(),
    setTargetDate: vi.fn(),
    setUserContext: userContext.setter,
    speakText: vi.fn().mockResolvedValue(undefined),
    studyApproach: 'corto',
    targetDate: '10 de abril de 2026',
    userContext: null,
    userId: 'user-1',
  };
}

describe('study-planner-calendar-analysis.service', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('resolves a fallback target date from assigned courses', () => {
    const result = resolveStudyPlannerEffectiveTargetDate({
      assignedCourses: [
        {
          courseId: 'course-1',
          dueDate: '2026-04-10T00:00:00.000Z',
          title: 'Curso',
        },
      ],
      studyApproach: 'balance',
      targetDate: null,
    });

    expect(result.effectiveApproach).toBe('balance');
    expect(result.effectiveTargetDate).toContain('abril');
  });

  it('stops the flow when calendar reconnection is required', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      createJsonResponse({ requiresReconnection: true }, 401),
    ) as typeof fetch;

    const params = createBaseParams();
    const handler = createAnalyzeCalendarAndSuggestHandler(params, {
      fetchStudyPlannerUserContext: vi.fn().mockResolvedValue({
        assignedCourses: [],
        rawProfile: { userType: 'b2c' },
        success: true,
        userContext: null,
        userId: 'user-1',
      }),
    });

    await handler('google');
    vi.runAllTimers();

    expect(params.setConnectedCalendar).toHaveBeenCalledWith(null);
    expect(params.setShowCalendarModal).toHaveBeenCalledWith(true);
    expect(params.analyzeCalendarAndSuggestB2B).not.toHaveBeenCalled();
    expect(params.setIsProcessing).toHaveBeenCalledWith(true);
    expect(params.setIsProcessing).toHaveBeenLastCalledWith(false);
  });
});
