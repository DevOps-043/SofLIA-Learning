import type { PageMetadata } from '../../types';
import { businessPanelUsersComponents } from './components';
import { businessPanelUsersApis } from './apis';
import { businessPanelUsersUserFlows } from './user-flows';
import { businessPanelUsersCommonIssues } from './common-issues';

export const businessPanelUsersMetadata: PageMetadata = {
  route: '/[orgSlug]/business-panel/users',
  routePattern: '/{orgSlug}/business-panel/users',
  pageType: 'business_panel_users',
  components: businessPanelUsersComponents,
  apis: businessPanelUsersApis,
  userFlows: businessPanelUsersUserFlows,
  commonIssues: businessPanelUsersCommonIssues,
};
