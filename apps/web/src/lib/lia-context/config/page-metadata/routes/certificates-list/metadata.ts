import type { PageMetadata } from '../../types';
import { certificatesListComponents } from './components';
import { certificatesListApis } from './apis';
import { certificatesListUserFlows } from './user-flows';
import { certificatesListCommonIssues } from './common-issues';

export const certificatesListMetadata: PageMetadata = {
  route: '/certificates',
  routePattern: '/certificates',
  pageType: 'certificates_list',
  components: certificatesListComponents,
  apis: certificatesListApis,
  userFlows: certificatesListUserFlows,
  commonIssues: certificatesListCommonIssues,
};
