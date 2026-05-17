import type { PageMetadata } from '../../types';
import { adminStatisticsComponents } from './components';
import { adminStatisticsApis } from './apis';
import { adminStatisticsUserFlows } from './user-flows';
import { adminStatisticsCommonIssues } from './common-issues';

export const adminStatisticsMetadata: PageMetadata = {
  route: '/admin/statistics',
  routePattern: '/admin/statistics',
  pageType: 'admin_statistics',
  components: adminStatisticsComponents,
  apis: adminStatisticsApis,
  userFlows: adminStatisticsUserFlows,
  commonIssues: adminStatisticsCommonIssues,
};
