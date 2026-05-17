import type { PageMetadata } from '../../types';
import { instructorDashboardComponents } from './components';
import { instructorDashboardApis } from './apis';
import { instructorDashboardUserFlows } from './user-flows';
import { instructorDashboardCommonIssues } from './common-issues';

export const instructorDashboardMetadata: PageMetadata = {
  route: '/instructor/dashboard',
  routePattern: '/instructor/dashboard',
  pageType: 'instructor_dashboard',
  components: instructorDashboardComponents,
  apis: instructorDashboardApis,
  userFlows: instructorDashboardUserFlows,
  commonIssues: instructorDashboardCommonIssues,
};
