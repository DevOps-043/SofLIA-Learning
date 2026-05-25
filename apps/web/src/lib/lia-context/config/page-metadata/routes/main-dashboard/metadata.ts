import type { PageMetadata } from '../../types';
import { mainDashboardComponents } from './components';
import { mainDashboardApis } from './apis';
import { mainDashboardUserFlows } from './user-flows';
import { mainDashboardCommonIssues } from './common-issues';

export const mainDashboardMetadata: PageMetadata = {
  route: '/dashboard',
  routePattern: '/dashboard',
  pageType: 'main_dashboard',
  components: mainDashboardComponents,
  apis: mainDashboardApis,
  userFlows: mainDashboardUserFlows,
  commonIssues: mainDashboardCommonIssues,
};
