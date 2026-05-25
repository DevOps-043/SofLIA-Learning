import type { PageMetadata } from '../../types';
import { authRegisterComponents } from './components';
import { authRegisterApis } from './apis';
import { authRegisterUserFlows } from './user-flows';
import { authRegisterCommonIssues } from './common-issues';

export const authRegisterMetadata: PageMetadata = {
  route: '/auth/[slug]/register',
  routePattern: '/auth/{slug}/register',
  pageType: 'auth_register',
  components: authRegisterComponents,
  apis: authRegisterApis,
  userFlows: authRegisterUserFlows,
  commonIssues: authRegisterCommonIssues,
};
