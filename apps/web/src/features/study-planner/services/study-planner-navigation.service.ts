export interface StudyPlannerNavigationPlan {
  dashboardDestination?: string | null;
  id: string;
  organizationSlug?: string | null;
}

function normalizeSlug(slug?: string | null): string | null {
  return typeof slug === 'string' && slug.trim() !== '' ? slug.trim() : null;
}

function sameSlug(left?: string | null, right?: string | null): boolean {
  const normalizedLeft = normalizeSlug(left);
  const normalizedRight = normalizeSlug(right);

  return Boolean(
    normalizedLeft
    && normalizedRight
    && normalizedLeft.toLowerCase() === normalizedRight.toLowerCase(),
  );
}

function buildBusinessUserDashboardPath(organizationSlug: string): string {
  return `/${encodeURIComponent(organizationSlug)}/business-user/dashboard`;
}

export function buildStudyPlannerEntryPath(params: {
  hasStudyPlan: boolean;
  organizationSlug?: string | null;
}): string {
  const basePath = params.hasStudyPlan
    ? '/study-planner/dashboard'
    : '/study-planner/create';
  const organizationSlug = normalizeSlug(params.organizationSlug);

  if (!organizationSlug) {
    return basePath;
  }

  const query = new URLSearchParams({ fromOrg: organizationSlug });
  return `${basePath}?${query.toString()}`;
}

export function resolveInitialStudyPlannerPlanId(params: {
  fromOrgSlug?: string | null;
  plans: StudyPlannerNavigationPlan[];
  preferredPlanId?: string | null;
  selectedPlanId?: string | null;
  urlPlanId?: string | null;
}): string | null {
  const candidatePlanId =
    params.preferredPlanId
    ?? params.selectedPlanId
    ?? params.urlPlanId
    ?? null;

  if (
    candidatePlanId
    && params.plans.some((plan) => plan.id === candidatePlanId)
  ) {
    return candidatePlanId;
  }

  const organizationPlan = params.fromOrgSlug
    ? params.plans.find((plan) => sameSlug(plan.organizationSlug, params.fromOrgSlug))
    : undefined;

  return organizationPlan?.id ?? params.plans[0]?.id ?? null;
}

export function resolveStudyPlannerDashboardDestination(params: {
  fromOrgSlug?: string | null;
  plans: StudyPlannerNavigationPlan[];
  selectedPlanId?: string | null;
}): string {
  const selectedPlan = params.selectedPlanId
    ? params.plans.find((plan) => plan.id === params.selectedPlanId)
    : undefined;
  const fromOrgSlug = normalizeSlug(params.fromOrgSlug);

  if (fromOrgSlug && !sameSlug(selectedPlan?.organizationSlug, fromOrgSlug)) {
    return buildBusinessUserDashboardPath(fromOrgSlug);
  }

  if (selectedPlan?.dashboardDestination) {
    return selectedPlan.dashboardDestination;
  }

  if (selectedPlan?.organizationSlug) {
    return buildBusinessUserDashboardPath(selectedPlan.organizationSlug);
  }

  if (fromOrgSlug) {
    return buildBusinessUserDashboardPath(fromOrgSlug);
  }

  return '/dashboard';
}
