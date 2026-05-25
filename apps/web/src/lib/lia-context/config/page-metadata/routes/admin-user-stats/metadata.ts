import type { PageMetadata } from '../../types';
import { adminUserStatsComponents } from './components';
import { adminUserStatsApis } from './apis';
import { adminUserStatsUserFlows } from './user-flows';
import { adminUserStatsCommonIssues } from './common-issues';

export const adminUserStatsMetadata: PageMetadata = {
  route: '/admin/user-stats',
  routePattern: '/admin/user-stats',
  pageType: 'admin_user_stats',
  components: adminUserStatsComponents,
  apis: adminUserStatsApis,
  userFlows: adminUserStatsUserFlows,
  commonIssues: adminUserStatsCommonIssues,
};
