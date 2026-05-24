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
  isMobile: boolean;
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
}: {
  courseTitle?: string;
  lessonTitle?: string;
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
  isMobile,
  translate,
}: BuildCourseLearnJoyrideStepsParams): Step[] {
  const interpolation = resolveInterpolationValues({
    courseTitle,
    lessonTitle,
    translate,
  });
  const sidebarTarget = getCourseLearnTourTargetSelector(
    isMobile ? 'mobileMaterialButton' : 'sidebar',
  );
  const sofliaTarget = getCourseLearnTourTargetSelector(
    isMobile ? 'liaMobileTrigger' : 'liaTrigger',
  );

  return [
    {
      target: getCourseLearnTourTargetSelector('workspace'),
      title: translate('tour.steps.welcome.title'),
      content: translate('tour.steps.welcome.description', interpolation),
      placement: 'center',
      skipBeacon: true,
      data: {
        icon: <Sparkles className="h-5 w-5 text-accent" />,
      },
    },
    {
      target: sidebarTarget,
      title: translate('tour.steps.sidebar.title'),
      content: translate('tour.steps.sidebar.description', interpolation),
      placement: isMobile ? 'top' : 'right',
      skipBeacon: true,
      data: {
        icon: <BookOpen className="h-5 w-5 text-accent" />,
      },
    },
    {
      target: getCourseLearnTourTargetSelector('videoPanel'),
      title: translate('tour.steps.videoPanel.title'),
      content: translate('tour.steps.videoPanel.description', interpolation),
      placement: isMobile ? 'bottom' : 'left-start',
      skipBeacon: true,
      floatingOptions: isMobile
        ? undefined
        : {
            hideArrow: true,
          },
      data: {
        icon: <PlaySquare className="h-5 w-5 text-accent" />,
        ...(isMobile
          ? {}
          : {
              tooltipDock: FIXED_LEFT_TOOLTIP_DOCK,
              tooltipWidth: COMPACT_TOOLTIP_WIDTH,
            }),
      },
    },
    {
      target: getCourseLearnTourTargetSelector('tools'),
      title: translate('tour.steps.tools.title'),
      content: translate('tour.steps.tools.description', interpolation),
      placement: isMobile ? 'top' : 'bottom',
      skipBeacon: true,
      data: {
        icon: <LayoutPanelTop className="h-5 w-5 text-accent" />,
      },
    },
    {
      target: sofliaTarget,
      title: translate('tour.steps.soflia.title'),
      content: translate('tour.steps.soflia.description', interpolation),
      placement: isMobile ? 'top' : 'top-end',
      skipBeacon: true,
      skipScroll: true,
      spotlightPadding: isMobile ? 12 : 20,
      data: {
        icon: <Bot className="h-5 w-5 text-accent" />,
      },
    },
    {
      target: getCourseLearnTourTargetSelector('replayButton'),
      title: translate('tour.steps.ready.title'),
      content: translate('tour.steps.ready.description', interpolation),
      placement: isMobile ? 'bottom' : 'bottom-end',
      skipBeacon: true,
      data: {
        icon: <Map className="h-5 w-5 text-accent" />,
      },
    },
  ];
}
