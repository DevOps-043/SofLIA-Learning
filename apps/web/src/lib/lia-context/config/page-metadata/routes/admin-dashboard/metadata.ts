import type { PageMetadata } from '../../types';
import { adminDashboardComponents } from './components';
import { adminDashboardApis } from './apis';
import { adminDashboardUserFlows } from './user-flows';
import { adminDashboardCommonIssues } from './common-issues';

export const adminDashboardMetadata: PageMetadata = {
  route: '/admin/dashboard',
  routePattern: '/admin/dashboard',
  pageType: 'admin_dashboard',
  components: adminDashboardComponents,
  apis: adminDashboardApis,
  userFlows: adminDashboardUserFlows,
  commonIssues: adminDashboardCommonIssues,
};
