// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import {
  ACTIONS,
  EVENTS,
  LIFECYCLE,
  STATUS,
  type CallBackProps,
} from 'react-joyride';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  COURSE_LEARN_JOYRIDE_STEP_INDEXES,
} from '../../config/course-learn-joyride-steps';
import { useCourseLearnJoyride } from '../useCourseLearnJoyride';

const completeTour = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
const skipTour = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
const startTour = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
const updateStep = vi.fn<(step: number) => Promise<void>>().mockResolvedValue(undefined);
const setRestart = vi.fn();

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
  useTourProgress: () => ({
    completeTour,
    isLoading: false,
    shouldShowTour: false,
    skipTour,
    startTour,
    updateStep,
  }),
}));

function buildCallbackProps(
  overrides: Partial<CallBackProps>,
  step: CallBackProps['step'],
): CallBackProps {
  return {
    action: ACTIONS.NEXT,
    controlled: true,
    index: COURSE_LEARN_JOYRIDE_STEP_INDEXES.welcome,
    lifecycle: LIFECYCLE.COMPLETE,
    origin: null,
    size: 6,
    status: STATUS.RUNNING,
    step,
    type: EVENTS.STEP_AFTER,
    ...overrides,
  };
}

describe('useCourseLearnJoyride', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
