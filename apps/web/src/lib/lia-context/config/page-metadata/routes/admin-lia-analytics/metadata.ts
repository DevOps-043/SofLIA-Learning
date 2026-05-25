import type { PageMetadata } from '../../types';
import { adminLiaAnalyticsComponents } from './components';
import { adminLiaAnalyticsApis } from './apis';
import { adminLiaAnalyticsUserFlows } from './user-flows';
import { adminLiaAnalyticsCommonIssues } from './common-issues';

export const adminLiaAnalyticsMetadata: PageMetadata = {
  route: '/admin/lia-analytics',
  routePattern: '/admin/lia-analytics',
  pageType: 'admin_lia_analytics',
  components: adminLiaAnalyticsComponents,
  apis: adminLiaAnalyticsApis,
  userFlows: adminLiaAnalyticsUserFlows,
  commonIssues: adminLiaAnalyticsCommonIssues,
};
