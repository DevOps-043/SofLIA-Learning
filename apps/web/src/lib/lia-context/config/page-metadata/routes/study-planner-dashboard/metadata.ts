import type { PageMetadata } from '../../types';
import { studyPlannerDashboardComponents } from './components';
import { studyPlannerDashboardApis } from './apis';
import { studyPlannerDashboardUserFlows } from './user-flows';
import { studyPlannerDashboardCommonIssues } from './common-issues';

export const studyPlannerDashboardMetadata: PageMetadata = {
  route: '/study-planner/dashboard',
  routePattern: '/study-planner/dashboard',
  pageType: 'study_planner_dashboard',
  components: studyPlannerDashboardComponents,
  apis: studyPlannerDashboardApis,
  userFlows: studyPlannerDashboardUserFlows,
  commonIssues: studyPlannerDashboardCommonIssues,
};
