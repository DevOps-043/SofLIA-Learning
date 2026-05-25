import type { PageMetadata } from '../../types';
import { liaLandingComponents } from './components';
import { liaLandingApis } from './apis';
import { liaLandingUserFlows } from './user-flows';
import { liaLandingCommonIssues } from './common-issues';

export const liaLandingMetadata: PageMetadata = {
  route: '/conocer-lia',
  routePattern: '/conocer-lia',
  pageType: 'lia_landing',
  components: liaLandingComponents,
  apis: liaLandingApis,
  userFlows: liaLandingUserFlows,
  commonIssues: liaLandingCommonIssues,
};
