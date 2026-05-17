import type { PageMetadata } from '../../types';
import { userProfileComponents } from './components';
import { userProfileApis } from './apis';
import { userProfileUserFlows } from './user-flows';
import { userProfileCommonIssues } from './common-issues';

export const userProfileMetadata: PageMetadata = {
  route: '/profile',
  routePattern: '/profile',
  pageType: 'user_profile',
  components: userProfileComponents,
  apis: userProfileApis,
  userFlows: userProfileUserFlows,
  commonIssues: userProfileCommonIssues,
};
