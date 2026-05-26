import type { TourConfig } from '@/features/tours'

export const courseLearnTour: TourConfig = {
  id: 'course-learn',
  autoStart: true,
  steps: [
    { target: '[data-tour-id="course-learn--workspace"]', titleKey: 'tours.courseLearn.welcome.title', contentKey: 'tours.courseLearn.welcome.content', placement: 'center', disableBeacon: true },
    { target: '[data-tour-id="course-learn--header"]', titleKey: 'tours.courseLearn.header.title', contentKey: 'tours.courseLearn.header.content', placement: 'bottom', disableBeacon: true },
    { target: '[data-tour-id="course-learn--progress"]', titleKey: 'tours.courseLearn.progress.title', contentKey: 'tours.courseLearn.progress.content', placement: 'bottom', disableBeacon: true },
    { target: '[data-tour-id="course-learn--sidebar"]', titleKey: 'tours.courseLearn.sidebar.title', contentKey: 'tours.courseLearn.sidebar.content', placement: 'right', disableBeacon: true },
    { target: '[data-tour-id="course-learn--module-progress"]', titleKey: 'tours.courseLearn.moduleProgress.title', contentKey: 'tours.courseLearn.moduleProgress.content', placement: 'right', disableBeacon: true, optional: true },
    { target: '[data-tour-id="course-learn--current-lesson"]', titleKey: 'tours.courseLearn.currentLesson.title', contentKey: 'tours.courseLearn.currentLesson.content', placement: 'right', disableBeacon: true, optional: true },
    { target: '[data-tour-id="course-learn--tabs"]', titleKey: 'tours.courseLearn.tabs.title', contentKey: 'tours.courseLearn.tabs.content', placement: 'auto', disableBeacon: true },
    { target: '[data-tour-id="course-learn--video-player"]', titleKey: 'tours.courseLearn.video.title', contentKey: 'tours.courseLearn.video.content', placement: 'auto', disableBeacon: true, optional: true },
    { target: '[data-tour-id="course-learn--lesson-resources"]', titleKey: 'tours.courseLearn.resources.title', contentKey: 'tours.courseLearn.resources.content', placement: 'auto', disableBeacon: true, optional: true },
    { target: '[data-tour-id="course-learn--tab-activities"]', titleKey: 'tours.courseLearn.activitiesTab.title', contentKey: 'tours.courseLearn.activitiesTab.content', placement: 'auto', disableBeacon: true },
    { target: '[data-tour-id="course-learn--activities-content"]', titleKey: 'tours.courseLearn.activities.title', contentKey: 'tours.courseLearn.activities.content', placement: 'auto', disableBeacon: true, optional: true },
    { target: '[data-tour-id="course-learn--tab-questions"]', titleKey: 'tours.courseLearn.questionsTab.title', contentKey: 'tours.courseLearn.questionsTab.content', placement: 'auto', disableBeacon: true },
    { target: '[data-tour-id="course-learn--questions-content"]', titleKey: 'tours.courseLearn.questions.title', contentKey: 'tours.courseLearn.questions.content', placement: 'auto', disableBeacon: true, optional: true },
    { target: '[data-tour-id="course-learn--soflia-panel"]', titleKey: 'tours.courseLearn.sofliaPanel.title', contentKey: 'tours.courseLearn.sofliaPanel.content', placement: 'left', disableBeacon: true, optional: true },
    { target: '[data-tour-id="soflia-floating-button"]', titleKey: 'tours.courseLearn.soflia.title', contentKey: 'tours.courseLearn.soflia.content', placement: 'left', disableBeacon: true, optional: true },
  ],
}
