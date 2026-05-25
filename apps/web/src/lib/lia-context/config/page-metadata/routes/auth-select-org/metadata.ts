import type { PageMetadata } from '../../types';
import { authSelectOrgComponents } from './components';
import { authSelectOrgApis } from './apis';
import { authSelectOrgUserFlows } from './user-flows';
import { authSelectOrgCommonIssues } from './common-issues';

export const authSelectOrgMetadata: PageMetadata = {
  route: '/auth/select-organization',
  routePattern: '/auth/select-organization',
  pageType: 'auth_select_org',
  components: authSelectOrgComponents,
  apis: authSelectOrgApis,
  userFlows: authSelectOrgUserFlows,
  commonIssues: authSelectOrgCommonIssues,
};
