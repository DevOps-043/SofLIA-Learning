import type { PageMetadata } from '../../types';
import { businessUserAnalyticsComponents } from './components';
import { businessUserAnalyticsApis } from './apis';
import { businessUserAnalyticsUserFlows } from './user-flows';
import { businessUserAnalyticsCommonIssues } from './common-issues';

export const businessUserAnalyticsMetadata: PageMetadata = {
  route: '/[orgSlug]/business-user/analytics',
  routePattern: '/{orgSlug}/business-user/analytics',
  pageType: 'business_user_analytics',
  components: businessUserAnalyticsComponents,
  apis: businessUserAnalyticsApis,
  userFlows: businessUserAnalyticsUserFlows,
  commonIssues: businessUserAnalyticsCommonIssues,
};
