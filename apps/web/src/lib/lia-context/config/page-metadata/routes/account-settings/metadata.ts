import type { PageMetadata } from '../../types';
import { accountSettingsComponents } from './components';
import { accountSettingsApis } from './apis';
import { accountSettingsUserFlows } from './user-flows';
import { accountSettingsCommonIssues } from './common-issues';

export const accountSettingsMetadata: PageMetadata = {
  route: '/account-settings',
  routePattern: '/account-settings',
  pageType: 'account_settings',
  components: accountSettingsComponents,
  apis: accountSettingsApis,
  userFlows: accountSettingsUserFlows,
  commonIssues: accountSettingsCommonIssues,
};
