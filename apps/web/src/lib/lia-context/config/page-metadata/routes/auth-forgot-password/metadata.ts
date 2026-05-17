import type { PageMetadata } from '../../types';
import { authForgotPasswordComponents } from './components';
import { authForgotPasswordApis } from './apis';
import { authForgotPasswordUserFlows } from './user-flows';
import { authForgotPasswordCommonIssues } from './common-issues';

export const authForgotPasswordMetadata: PageMetadata = {
  route: '/auth/forgot-password',
  routePattern: '/auth/forgot-password',
  pageType: 'auth_forgot_password',
  components: authForgotPasswordComponents,
  apis: authForgotPasswordApis,
  userFlows: authForgotPasswordUserFlows,
  commonIssues: authForgotPasswordCommonIssues,
};
