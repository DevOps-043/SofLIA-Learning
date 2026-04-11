import React from 'react';
import type { Step } from 'react-joyride';
import {
  BookOpen,
  Bot,
  LayoutPanelTop,
  Map,
  PlaySquare,
  Sparkles,
} from 'lucide-react';

import {
  getCourseLearnTourTargetSelector,
} from '../../../core/constants/tourTargets';

type CourseLearnJoyrideTranslationKey =
  | 'tour.fallbacks.courseTitle'
  | 'tour.fallbacks.lessonTitle'
  | 'tour.steps.ready.description'
  | 'tour.steps.ready.title'
  | 'tour.steps.sidebar.description'
  | 'tour.steps.sidebar.title'
  | 'tour.steps.soflia.description'
  | 'tour.steps.soflia.title'
  | 'tour.steps.tools.description'
  | 'tour.steps.tools.title'
  | 'tour.steps.videoPanel.description'
  | 'tour.steps.videoPanel.title'
  | 'tour.steps.welcome.description'
  | 'tour.steps.welcome.title';

type CourseLearnJoyrideInterpolation = {
  courseTitle?: string;
  lessonTitle?: string;
};

export type CourseLearnJoyrideTranslator = (
  key: CourseLearnJoyrideTranslationKey,
  interpolation?: CourseLearnJoyrideInterpolation,
) => string;

type BuildCourseLearnJoyrideStepsParams = {
  courseTitle?: string;
  lessonTitle?: string;
  translate: CourseLearnJoyrideTranslator;
};

const COURSE_LEARN_TOUR_ID_PREFIX = 'course-learn';
const COMPACT_TOOLTIP_WIDTH = 'compact';
const FIXED_LEFT_TOOLTIP_DOCK = 'fixed-left';

export const COURSE_LEARN_JOYRIDE_STEP_INDEXES = {
  welcome: 0,
  sidebar: 1,
  videoPanel: 2,
  tools: 3,
  soflia: 4,
  ready: 5,
} as const;

function resolveInterpolationValues({
  courseTitle,
  lessonTitle,
  translate,
}: Omit<BuildCourseLearnJoyrideStepsParams, 'translate'> & {
  translate: CourseLearnJoyrideTranslator;
}): Required<CourseLearnJoyrideInterpolation> {
  return {
    courseTitle:
      courseTitle?.trim() || translate('tour.fallbacks.courseTitle'),
    lessonTitle:
      lessonTitle?.trim() || translate('tour.fallbacks.lessonTitle'),
  };
}

export function buildCourseLearnTourId(courseSlug: string): string {
  return `${COURSE_LEARN_TOUR_ID_PREFIX}-${courseSlug}`;
}

export function buildCourseLearnJoyrideSteps({
  courseTitle,
  lessonTitle,
  translate,
}: BuildCourseLearnJoyrideStepsParams): Step[] {
  const interpolation = resolveInterpolationValues({
    courseTitle,
    lessonTitle,
    translate,
  });

  return [
    {
      target: getCourseLearnTourTargetSelector('workspace'),
      title: translate('tour.steps.welcome.title'),
      content: translate('tour.steps.welcome.description', interpolation),
      placement: 'center',
      disableBeacon: true,
      data: {
        icon: <Sparkles className="h-5 w-5 text-[#00D4B3]" />,
      },
    },
    {
      target: getCourseLearnTourTargetSelector('sidebar'),
      title: translate('tour.steps.sidebar.title'),
      content: translate('tour.steps.sidebar.description', interpolation),
      placement: 'right',
      disableBeacon: true,
      data: {
        icon: <BookOpen className="h-5 w-5 text-[#00D4B3]" />,
      },
    },
    {
      target: getCourseLearnTourTargetSelector('videoPanel'),
      title: translate('tour.steps.videoPanel.title'),
      content: translate('tour.steps.videoPanel.description', interpolation),
      placement: 'left-start',
      disableBeacon: true,
      floaterProps: {
        hideArrow: true,
      },
      data: {
        icon: <PlaySquare className="h-5 w-5 text-[#00D4B3]" />,
        tooltipDock: FIXED_LEFT_TOOLTIP_DOCK,
        tooltipWidth: COMPACT_TOOLTIP_WIDTH,
      },
    },
    {
      target: getCourseLearnTourTargetSelector('tools'),
      title: translate('tour.steps.tools.title'),
      content: translate('tour.steps.tools.description', interpolation),
      placement: 'bottom',
      disableBeacon: true,
      data: {
        icon: <LayoutPanelTop className="h-5 w-5 text-[#00D4B3]" />,
      },
    },
    {
      target: getCourseLearnTourTargetSelector('liaTrigger'),
      title: translate('tour.steps.soflia.title'),
      content: translate('tour.steps.soflia.description', interpolation),
      placement: 'top-end',
      disableBeacon: true,
      disableScrolling: true,
      spotlightPadding: 20,
      data: {
        icon: <Bot className="h-5 w-5 text-[#00D4B3]" />,
      },
    },
    {
      target: getCourseLearnTourTargetSelector('replayButton'),
      title: translate('tour.steps.ready.title'),
      content: translate('tour.steps.ready.description', interpolation),
      placement: 'bottom-end',
      disableBeacon: true,
      data: {
        icon: <Map className="h-5 w-5 text-[#00D4B3]" />,
      },
    },
  ];
}
