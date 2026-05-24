// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import {
  ACTIONS,
  EVENTS,
  LIFECYCLE,
  STATUS,
  type EventData,
} from 'react-joyride';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  COURSE_LEARN_JOYRIDE_STEP_INDEXES,
} from '../../config/course-learn-joyride-steps';
import { useCourseLearnJoyride } from '../useCourseLearnJoyride';

const completeTour = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
const skipTour = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
const startTour = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
const updateStep = vi.fn<(step: number) => void>();
const setRestart = vi.fn();
const tourProgressState = {
  completeTour,
  isLoading: false,
  shouldShowTour: false,
  skipTour,
  startTour,
  updateStep,
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, interpolation?: Record<string, string>) => {
      const value = key;

      if (!interpolation) {
        return value;
      }

      return Object.entries(interpolation).reduce(
        (accumulator, [token, tokenValue]) =>
          accumulator.replace(`{{${token}}}`, tokenValue),
        value,
      );
    },
  }),
}));

vi.mock('../../../../core/contexts/TourRestartContext', () => ({
  useTourRestart: () => ({
    setRestart,
  }),
}));

vi.mock('../useTourProgress', () => ({
  useTourProgress: () => tourProgressState,
}));

function buildCallbackProps(
  overrides: Partial<EventData>,
  step: EventData['step'],
): EventData {
  return {
    action: ACTIONS.NEXT,
    controlled: true,
    error: null,
    index: COURSE_LEARN_JOYRIDE_STEP_INDEXES.welcome,
    lifecycle: LIFECYCLE.COMPLETE,
    origin: null,
    scroll: null,
    scrolling: false,
    size: 6,
    status: STATUS.RUNNING,
    step,
    type: EVENTS.STEP_AFTER,
    waiting: false,
    ...overrides,
  } as EventData;
}

function appendTourTarget(id: string): HTMLElement {
  const element = document.createElement('div');
  element.id = id;
  element.getBoundingClientRect = vi.fn(() => ({
    bottom: 120,
    height: 80,
    left: 20,
    right: 220,
    toJSON: () => '',
    top: 40,
    width: 200,
    x: 20,
    y: 40,
  }));
  document.body.appendChild(element);
  return element;
}

describe('useCourseLearnJoyride', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tourProgressState.isLoading = false;
    tourProgressState.shouldShowTour = false;
    vi.useRealTimers();
    document.body.innerHTML = '';
    appendTourTarget('course-learn-workspace');
  });

  it('completes and closes the tour when the final step advances past the last index', async () => {
    const { result } = renderHook(() =>
      useCourseLearnJoyride({
        closeLia: vi.fn(),
        closeLeftPanel: vi.fn(),
        courseSlug: 'stack-tech-1',
        courseTitle: 'Curso de prueba',
        enabled: true,
        isMobile: false,
        lessonTitle: 'Leccion de prueba',
        openLeftPanel: vi.fn(),
        setActiveTab: vi.fn(),
      }),
    );

    const finalStep =
      result.current.joyrideProps.steps[COURSE_LEARN_JOYRIDE_STEP_INDEXES.ready];

    await act(async () => {
      await result.current.joyrideProps.callback(
        buildCallbackProps(
          {
            index: COURSE_LEARN_JOYRIDE_STEP_INDEXES.ready,
            step: finalStep,
          },
          finalStep,
        ),
      );
    });

    expect(completeTour).toHaveBeenCalledTimes(1);
    expect(skipTour).not.toHaveBeenCalled();
    expect(result.current.run).toBe(false);
    expect(result.current.stepIndex).toBe(
      COURSE_LEARN_JOYRIDE_STEP_INDEXES.welcome,
    );
  });

  it('suppresses video playback and launches the tour when it should be shown', async () => {
    vi.useFakeTimers();
    tourProgressState.shouldShowTour = true;

    const pauseVideoPlayback = vi.fn();
    const clearPendingAutoPlay = vi.fn();

    const { result } = renderHook(() =>
      useCourseLearnJoyride({
        clearPendingAutoPlay,
        closeLia: vi.fn(),
        closeLeftPanel: vi.fn(),
        courseSlug: 'stack-tech-1',
        courseTitle: 'Curso de prueba',
        enabled: true,
        isMobile: false,
        lessonTitle: 'Leccion de prueba',
        openLeftPanel: vi.fn(),
        pauseVideoPlayback,
        setActiveTab: vi.fn(),
      }),
    );

    expect(result.current.suppressVideoPlayback).toBe(true);
    expect(result.current.skipVideoAutoplay).toBe(true);
    expect(clearPendingAutoPlay).toHaveBeenCalled();
    expect(pauseVideoPlayback).toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2200);
      await Promise.resolve();
    });

    expect(startTour).toHaveBeenCalledTimes(1);
    expect(result.current.run).toBe(true);
  });
});
