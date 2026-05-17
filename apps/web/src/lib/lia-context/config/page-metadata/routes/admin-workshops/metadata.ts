import type { PageMetadata } from '../../types';
import { adminWorkshopsComponents } from './components';
import { adminWorkshopsApis } from './apis';
import { adminWorkshopsUserFlows } from './user-flows';
import { adminWorkshopsCommonIssues } from './common-issues';

export const adminWorkshopsMetadata: PageMetadata = {
  route: '/admin/workshops',
  routePattern: '/admin/workshops',
  pageType: 'admin_workshops',
  components: adminWorkshopsComponents,
  apis: adminWorkshopsApis,
  userFlows: adminWorkshopsUserFlows,
  commonIssues: adminWorkshopsCommonIssues,
};
