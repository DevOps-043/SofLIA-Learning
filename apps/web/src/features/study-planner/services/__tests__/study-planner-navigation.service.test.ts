import { describe, expect, it } from 'vitest';
import {
  buildStudyPlannerEntryPath,
  resolveInitialStudyPlannerPlanId,
  resolveStudyPlannerDashboardDestination,
} from '../study-planner-navigation.service';

describe('study-planner-navigation.service', () => {
  it('keeps the source organization when entering the planner from an org dashboard', () => {
    expect(
      buildStudyPlannerEntryPath({
        hasStudyPlan: true,
        organizationSlug: 'board-ready',
      }),
    ).toBe('/study-planner/dashboard?fromOrg=board-ready');

    expect(
      buildStudyPlannerEntryPath({
        hasStudyPlan: false,
        organizationSlug: 'board-ready',
      }),
    ).toBe('/study-planner/create?fromOrg=board-ready');
  });

  it('prefers the plan that belongs to the source organization when no plan is explicit', () => {
    const plans = [
      { id: 'pulse-plan', organizationSlug: 'Pulse-Hub' },
      { id: 'board-plan', organizationSlug: 'board-ready' },
    ];

    expect(
      resolveInitialStudyPlannerPlanId({
        fromOrgSlug: 'board-ready',
        plans,
      }),
    ).toBe('board-plan');
  });

  it('uses an explicit plan id before source organization matching', () => {
    const plans = [
      { id: 'pulse-plan', organizationSlug: 'Pulse-Hub' },
      { id: 'board-plan', organizationSlug: 'board-ready' },
    ];

    expect(
      resolveInitialStudyPlannerPlanId({
        fromOrgSlug: 'board-ready',
        plans,
        urlPlanId: 'pulse-plan',
      }),
    ).toBe('pulse-plan');
  });

  it('routes back to the selected plan organization when there is no source org', () => {
    expect(
      resolveStudyPlannerDashboardDestination({
        plans: [
          {
            dashboardDestination: '/board-ready/business-user/dashboard',
            id: 'board-plan',
            organizationSlug: 'board-ready',
          },
        ],
        selectedPlanId: 'board-plan',
      }),
    ).toBe('/board-ready/business-user/dashboard');
  });

  it('does not let a mismatched selected plan override the source org', () => {
    expect(
      resolveStudyPlannerDashboardDestination({
        fromOrgSlug: 'board-ready',
        plans: [
          {
            dashboardDestination: '/Pulse-Hub/business-panel/dashboard',
            id: 'pulse-plan',
            organizationSlug: 'Pulse-Hub',
          },
        ],
        selectedPlanId: 'pulse-plan',
      }),
    ).toBe('/board-ready/business-user/dashboard');
  });
});
