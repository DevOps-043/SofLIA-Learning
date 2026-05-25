import type { PageMetadata } from '../../types';
import { certificateVerifyComponents } from './components';
import { certificateVerifyApis } from './apis';
import { certificateVerifyUserFlows } from './user-flows';
import { certificateVerifyCommonIssues } from './common-issues';

export const certificateVerifyMetadata: PageMetadata = {
  route: '/certificates/verify',
  routePattern: '/certificates/verify',
  pageType: 'certificate_verify',
  components: certificateVerifyComponents,
  apis: certificateVerifyApis,
  userFlows: certificateVerifyUserFlows,
  commonIssues: certificateVerifyCommonIssues,
};
