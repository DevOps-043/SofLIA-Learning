import { describe, expect, it } from 'vitest';

import {
  BUSINESS_USER_ANALYTICS_TOUR_TARGET_IDS,
  NOTEBOOK_TOUR_TARGET_IDS,
  PROFILE_TOUR_TARGET_IDS,
  SELECT_ORGANIZATION_TOUR_TARGET_IDS,
} from '../../../../core/constants/tourTargets';
import {
  PROFILE_MINITOUR_ID,
  buildProfileMinitourSteps,
} from '../profile-minitour-steps';
import {
  BUSINESS_USER_ANALYTICS_MINITOUR_ID,
  buildBusinessUserAnalyticsMinitourSteps,
} from '../business-user-analytics-minitour-steps';
import {
  SELECT_ORGANIZATION_MINITOUR_ID,
  buildSelectOrganizationMinitourSteps,
} from '../select-organization-minitour-steps';
import {
  NOTEBOOK_MINITOUR_ID,
  buildNotebookMinitourSteps,
} from '../notebook-minitour-steps';

const t = (key: string) => key;

describe('minitour step configs', () => {
  it('keeps minitour ids stable', () => {
    expect(PROFILE_MINITOUR_ID).toBe('profile-minitour-v1');
    expect(BUSINESS_USER_ANALYTICS_MINITOUR_ID).toBe(
      'business-user-analytics-minitour-v1',
    );
    expect(SELECT_ORGANIZATION_MINITOUR_ID).toBe(
      'select-organization-minitour-v1',
    );
    expect(NOTEBOOK_MINITOUR_ID).toBe('notebook-minitour-v1');
  });

  it('builds profile tour targets in the expected order', () => {
    const steps = buildProfileMinitourSteps(t);

    expect(steps.map((step) => step.target)).toEqual([
      `#${PROFILE_TOUR_TARGET_IDS.hero}`,
      `#${PROFILE_TOUR_TARGET_IDS.avatar}`,
      `#${PROFILE_TOUR_TARGET_IDS.summary}`,
      `#${PROFILE_TOUR_TARGET_IDS.stats}`,
      `#${PROFILE_TOUR_TARGET_IDS.tabs}`,
      `#${PROFILE_TOUR_TARGET_IDS.personalForm}`,
      `#${PROFILE_TOUR_TARGET_IDS.securitySection}`,
    ]);
  });

  it('builds analytics tour targets in the expected order', () => {
    const steps = buildBusinessUserAnalyticsMinitourSteps(t);

    expect(steps.map((step) => step.target)).toEqual([
      `#${BUSINESS_USER_ANALYTICS_TOUR_TARGET_IDS.header}`,
      `#${BUSINESS_USER_ANALYTICS_TOUR_TARGET_IDS.rangeControls}`,
      `#${BUSINESS_USER_ANALYTICS_TOUR_TARGET_IDS.metrics}`,
      `#${BUSINESS_USER_ANALYTICS_TOUR_TARGET_IDS.courseProgress}`,
      `#${BUSINESS_USER_ANALYTICS_TOUR_TARGET_IDS.aiAdoption}`,
      `#${BUSINESS_USER_ANALYTICS_TOUR_TARGET_IDS.feedback}`,
      `#${BUSINESS_USER_ANALYTICS_TOUR_TARGET_IDS.heatmap}`,
    ]);
  });

  it('builds organization selection tour targets in the expected order', () => {
    const steps = buildSelectOrganizationMinitourSteps(t);

    expect(steps.map((step) => step.target)).toEqual([
      `#${SELECT_ORGANIZATION_TOUR_TARGET_IDS.header}`,
      `#${SELECT_ORGANIZATION_TOUR_TARGET_IDS.counter}`,
      `#${SELECT_ORGANIZATION_TOUR_TARGET_IDS.card}`,
      `#${SELECT_ORGANIZATION_TOUR_TARGET_IDS.role}`,
      `#${SELECT_ORGANIZATION_TOUR_TARGET_IDS.action}`,
      `#${SELECT_ORGANIZATION_TOUR_TARGET_IDS.grid}`,
    ]);
  });

  it('builds notebook tour targets in the expected order', () => {
    const steps = buildNotebookMinitourSteps(t);

    expect(steps.map((step) => step.target)).toEqual([
      `#${NOTEBOOK_TOUR_TARGET_IDS.toolbar}`,
      `#${NOTEBOOK_TOUR_TARGET_IDS.header}`,
      `#${NOTEBOOK_TOUR_TARGET_IDS.tabs}`,
      `#${NOTEBOOK_TOUR_TARGET_IDS.courseFilter}`,
      `#${NOTEBOOK_TOUR_TARGET_IDS.notesGrid}`,
    ]);
  });
});
