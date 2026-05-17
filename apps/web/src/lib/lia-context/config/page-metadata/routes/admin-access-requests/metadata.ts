import type { PageMetadata } from '../../types';
import { adminAccessRequestsComponents } from './components';
import { adminAccessRequestsApis } from './apis';
import { adminAccessRequestsUserFlows } from './user-flows';
import { adminAccessRequestsCommonIssues } from './common-issues';

export const adminAccessRequestsMetadata: PageMetadata = {
  route: '/admin/access-requests',
  routePattern: '/admin/access-requests',
  pageType: 'admin_access_requests',
  components: adminAccessRequestsComponents,
  apis: adminAccessRequestsApis,
  userFlows: adminAccessRequestsUserFlows,
  commonIssues: adminAccessRequestsCommonIssues,
};
