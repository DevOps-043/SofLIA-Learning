import type { PageMetadata } from '../../types';
import { businessUserDashboardComponents } from './components';
import { businessUserDashboardApis } from './apis';
import { businessUserDashboardUserFlows } from './user-flows';
import { businessUserDashboardCommonIssues } from './common-issues';

export const businessUserDashboardMetadata: PageMetadata = {
  route: '/[orgSlug]/business-user/dashboard',
  routePattern: '/{orgSlug}/business-user/dashboard',
  pageType: 'business_user_dashboard',
  components: businessUserDashboardComponents,
  apis: businessUserDashboardApis,
  userFlows: businessUserDashboardUserFlows,
  commonIssues: businessUserDashboardCommonIssues,
};
