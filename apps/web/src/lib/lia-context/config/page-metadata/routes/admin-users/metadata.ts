import type { PageMetadata } from '../../types';
import { adminUsersComponents } from './components';
import { adminUsersApis } from './apis';
import { adminUsersUserFlows } from './user-flows';
import { adminUsersCommonIssues } from './common-issues';

export const adminUsersMetadata: PageMetadata = {
  route: '/admin/users',
  routePattern: '/admin/users',
  pageType: 'admin_users',
  components: adminUsersComponents,
  apis: adminUsersApis,
  userFlows: adminUsersUserFlows,
  commonIssues: adminUsersCommonIssues,
};
