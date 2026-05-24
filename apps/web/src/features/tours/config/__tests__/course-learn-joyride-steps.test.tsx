import { describe, expect, it } from 'vitest';

import {
  COURSE_LEARN_JOYRIDE_STEP_INDEXES,
  buildCourseLearnJoyrideSteps,
  buildCourseLearnTourId,
  type CourseLearnJoyrideTranslator,
} from '../course-learn-joyride-steps';
import { COURSE_LEARN_TOUR_TARGET_IDS } from '../../../../core/constants/tourTargets';

const translations = {
  'tour.fallbacks.courseTitle': 'tu curso actual',
  'tour.fallbacks.lessonTitle': 'la leccion actual',
  'tour.steps.ready.description':
    'Puedes reabrir esta guia cuando lo necesites.',
  'tour.steps.ready.title': 'Listo para comenzar',
  'tour.steps.sidebar.description':
    'Aqui veras modulos, lecciones y tus notas.',
  'tour.steps.sidebar.title': 'Panel izquierdo',
  'tour.steps.soflia.description':
    'SofLIA conoce el curso y la leccion actual.',
  'tour.steps.soflia.title': 'SofLIA',
  'tour.steps.tools.description':
    'Usa actividades y preguntas para practicar.',
  'tour.steps.tools.title': 'Herramientas',
  'tour.steps.videoPanel.description':
    'Revisa video, transcripcion y resumen de {{lessonTitle}}.',
  'tour.steps.videoPanel.title': 'Video',
  'tour.steps.welcome.description':
    'Bienvenido a {{courseTitle}}.',
  'tour.steps.welcome.title': 'Bienvenido',
} satisfies Record<string, string>;

const translate: CourseLearnJoyrideTranslator = (key, interpolation) => {
  const rawValue = translations[key];

  if (!interpolation) {
    return rawValue;
  }

  return rawValue.replace(/\{\{(\w+)\}\}/g, (_, token: string) => {
    const value = interpolation[token as keyof typeof interpolation];
    return value ?? '';
  });
};

describe('course-learn-joyride-steps', () => {
  it('builds a stable course-specific tour id', () => {
    expect(buildCourseLearnTourId('stack-tech-1')).toBe(
      'course-learn-stack-tech-1',
    );
  });

  it('builds the expected desktop steps and selectors', () => {
    const steps = buildCourseLearnJoyrideSteps({
      courseTitle: 'IA para lideres',
      isMobile: false,
      lessonTitle: 'Cultura de adopcion responsable',
      translate,
    });

    expect(steps).toHaveLength(6);
    expect(steps[COURSE_LEARN_JOYRIDE_STEP_INDEXES.welcome].target).toBe(
      `#${COURSE_LEARN_TOUR_TARGET_IDS.workspace}`,
    );
    expect(steps[COURSE_LEARN_JOYRIDE_STEP_INDEXES.sidebar].target).toBe(
      `#${COURSE_LEARN_TOUR_TARGET_IDS.sidebar}`,
    );
    expect(steps[COURSE_LEARN_JOYRIDE_STEP_INDEXES.videoPanel].target).toBe(
      `#${COURSE_LEARN_TOUR_TARGET_IDS.videoPanel}`,
    );
    expect(steps[COURSE_LEARN_JOYRIDE_STEP_INDEXES.videoPanel].placement).toBe(
      'left-start',
    );
    expect(
      steps[COURSE_LEARN_JOYRIDE_STEP_INDEXES.videoPanel].floatingOptions?.hideArrow,
    ).toBe(true);
    expect(
      steps[COURSE_LEARN_JOYRIDE_STEP_INDEXES.videoPanel].data,
    ).toMatchObject({
      tooltipDock: 'fixed-left',
      tooltipWidth: 'compact',
    });
    expect(steps[COURSE_LEARN_JOYRIDE_STEP_INDEXES.tools].target).toBe(
      `#${COURSE_LEARN_TOUR_TARGET_IDS.tools}`,
    );
    expect(steps[COURSE_LEARN_JOYRIDE_STEP_INDEXES.soflia].target).toBe(
      `#${COURSE_LEARN_TOUR_TARGET_IDS.liaTrigger}`,
    );
    expect(steps[COURSE_LEARN_JOYRIDE_STEP_INDEXES.ready].target).toBe(
      `#${COURSE_LEARN_TOUR_TARGET_IDS.replayButton}`,
    );
  });

  it('uses fallback labels when course or lesson titles are missing', () => {
    const steps = buildCourseLearnJoyrideSteps({
      courseTitle: '',
      isMobile: false,
      lessonTitle: '',
      translate,
    });

    expect(steps[COURSE_LEARN_JOYRIDE_STEP_INDEXES.welcome].content).toBe(
      'Bienvenido a tu curso actual.',
    );
    expect(steps[COURSE_LEARN_JOYRIDE_STEP_INDEXES.videoPanel].content).toBe(
      'Revisa video, transcripcion y resumen de la leccion actual.',
    );
  });

  it('builds mobile-safe targets and placements', () => {
    const steps = buildCourseLearnJoyrideSteps({
      courseTitle: 'IA Esencial',
      isMobile: true,
      lessonTitle: 'Introduccion',
      translate,
    });

    expect(steps[COURSE_LEARN_JOYRIDE_STEP_INDEXES.sidebar].target).toBe(
      `#${COURSE_LEARN_TOUR_TARGET_IDS.mobileMaterialButton}`,
    );
    expect(steps[COURSE_LEARN_JOYRIDE_STEP_INDEXES.sidebar].placement).toBe(
      'top',
    );
    expect(steps[COURSE_LEARN_JOYRIDE_STEP_INDEXES.videoPanel].placement).toBe(
      'bottom',
    );
    expect(
      steps[COURSE_LEARN_JOYRIDE_STEP_INDEXES.videoPanel].data,
    ).not.toMatchObject({
      tooltipDock: 'fixed-left',
    });
    expect(steps[COURSE_LEARN_JOYRIDE_STEP_INDEXES.soflia].target).toBe(
      `#${COURSE_LEARN_TOUR_TARGET_IDS.liaMobileTrigger}`,
    );
    expect(steps[COURSE_LEARN_JOYRIDE_STEP_INDEXES.ready].placement).toBe(
      'bottom',
    );
  });
});
