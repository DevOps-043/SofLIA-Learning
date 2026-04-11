export const SHARED_TOUR_TARGET_IDS = {
  liaTrigger: 'lia-tour-trigger-stable',
} as const;

export const COURSE_LEARN_TOUR_TARGET_IDS = {
  workspace: 'course-learn-workspace',
  sidebar: 'course-learn-sidebar',
  videoPanel: 'course-learn-video-panel',
  tools: 'course-learn-tools',
  replayButton: 'course-learn-replay-button',
  liaTrigger: SHARED_TOUR_TARGET_IDS.liaTrigger,
} as const;

export type CourseLearnTourTargetKey =
  keyof typeof COURSE_LEARN_TOUR_TARGET_IDS;

export function getCourseLearnTourTargetSelector(
  target: CourseLearnTourTargetKey,
): string {
  return `#${COURSE_LEARN_TOUR_TARGET_IDS[target]}`;
}
