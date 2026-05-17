import type { PageMetadata } from '../../types';
import { authResetPasswordComponents } from './components';
import { authResetPasswordApis } from './apis';
import { authResetPasswordUserFlows } from './user-flows';
import { authResetPasswordCommonIssues } from './common-issues';

export const authResetPasswordMetadata: PageMetadata = {
  route: '/auth/reset-password',
  routePattern: '/auth/reset-password',
  pageType: 'auth_reset_password',
  components: authResetPasswordComponents,
  apis: authResetPasswordApis,
  userFlows: authResetPasswordUserFlows,
  commonIssues: authResetPasswordCommonIssues,
};
