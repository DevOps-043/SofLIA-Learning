import { describe, expect, it } from 'vitest';

import {
  BUSINESS_USER_TOUR_STEP_BEHAVIOR,
  buildBusinessUserJoyrideSteps,
  DASHBOARD_TOUR_ID,
} from '../business-user-joyride-steps';
import {
  BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS,
  SHARED_TOUR_TARGET_IDS,
} from '../../../../core/constants/tourTargets';

describe('business-user-joyride-steps', () => {
  it('keeps the dashboard tour id stable', () => {
    expect(DASHBOARD_TOUR_ID).toBe('business-dashboard');
  });

  it('builds desktop targets for the dashboard tour', () => {
    const steps = buildBusinessUserJoyrideSteps({ isMobile: false });

    expect(steps[0].target).toBe(
      `#${BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.heroSection}`,
    );
    expect(steps[1].target).toBe(
      `#${BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.userDropdownTrigger}`,
    );
    expect(steps[1].placement).toBe('bottom-end');
    expect(steps[2].target).toBe(
      `#${BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.userDropdownMenu}`,
    );
    expect(steps[2].data).toMatchObject({
      behavior: BUSINESS_USER_TOUR_STEP_BEHAVIOR.openUserMenu,
    });
    expect(steps[3].target).toBe(
      `#${BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.courseViewSwitcher}`,
    );
    expect(steps[3].placement).toBe('left');
    expect(steps[4].target).toBe(
      `#${BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.learningPathSection}`,
    );
    expect(steps[4].data).toMatchObject({
      behavior: BUSINESS_USER_TOUR_STEP_BEHAVIOR.showLearningPaths,
    });
    expect(steps[5].target).toBe(
      `#${BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.learningPathIntroVideo}`,
    );
    expect(steps[5].placement).toBe('left');
    expect(steps[6].target).toBe(
      `#${BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.learningPathSection}`,
    );
    expect(steps[7].target).toBe(`#${SHARED_TOUR_TARGET_IDS.liaTrigger}`);
    expect(steps[7].placement).toBe('top-end');
  });

  it('builds mobile-safe targets and placements', () => {
    const steps = buildBusinessUserJoyrideSteps({ isMobile: true });

    expect(steps[1].target).toBe(
      `#${BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.mobileMenuTrigger}`,
    );
    expect(steps[1].placement).toBe('bottom');
    expect(steps[2].target).toBe(
      `#${BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.mobileMenuPanel}`,
    );
    expect(steps[2].placement).toBe('bottom');
    expect(steps[3].target).toBe(
      `#${BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.courseViewSwitcher}`,
    );
    expect(steps[3].placement).toBe('top');
    expect(steps[4].target).toBe(
      `#${BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.learningPathSection}`,
    );
    expect(steps[5].target).toBe(
      `#${BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.learningPathIntroVideo}`,
    );
    expect(steps[5].placement).toBe('top');
    expect(steps[7].target).toBe(`#${SHARED_TOUR_TARGET_IDS.liaTrigger}`);
    expect(steps[7].placement).toBe('top');
  });

  it('omits learning path steps when the user has no assigned paths', () => {
    const steps = buildBusinessUserJoyrideSteps({
      hasLearningPaths: false,
      isMobile: false,
    });

    expect(steps).toHaveLength(5);
    expect(steps.map((step) => step.target)).not.toContain(
      `#${BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.learningPathSection}`,
    );
    expect(steps.map((step) => step.target)).not.toContain(
      `#${BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.learningPathIntroVideo}`,
    );
  });
});
