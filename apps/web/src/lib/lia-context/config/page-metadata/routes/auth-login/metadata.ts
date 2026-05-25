import type { PageMetadata } from '../../types';
import { authLoginComponents } from './components';
import { authLoginApis } from './apis';
import { authLoginUserFlows } from './user-flows';
import { authLoginCommonIssues } from './common-issues';

export const authLoginMetadata: PageMetadata = {
  route: '/auth',
  routePattern: '/auth',
  pageType: 'auth_login',
  components: authLoginComponents,
  apis: authLoginApis,
  userFlows: authLoginUserFlows,
  commonIssues: authLoginCommonIssues,
};
