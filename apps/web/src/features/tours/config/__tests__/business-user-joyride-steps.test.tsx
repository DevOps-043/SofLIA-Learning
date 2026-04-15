import { describe, expect, it } from 'vitest';

import {
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
      `#${BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.statsSection}`,
    );
    expect(steps[2].target).toBe(
      `#${BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.statCourses}`,
    );
    expect(steps[3].target).toBe(
      `#${BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.statCertificates}`,
    );
    expect(steps[4].target).toBe(
      `#${BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.userDropdownTrigger}`,
    );
    expect(steps[4].placement).toBe('bottom-end');
    expect(steps[5].target).toBe(`#${SHARED_TOUR_TARGET_IDS.liaTrigger}`);
    expect(steps[5].placement).toBe('top-end');
  });

  it('builds mobile-safe targets and placements', () => {
    const steps = buildBusinessUserJoyrideSteps({ isMobile: true });

    expect(steps[1].placement).toBe('top');
    expect(steps[2].placement).toBe('bottom');
    expect(steps[3].placement).toBe('bottom');
    expect(steps[4].target).toBe(
      `#${BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.mobileMenuTrigger}`,
    );
    expect(steps[4].placement).toBe('bottom');
    expect(steps[5].target).toBe(`#${SHARED_TOUR_TARGET_IDS.liaTrigger}`);
    expect(steps[5].placement).toBe('top');
  });
});
