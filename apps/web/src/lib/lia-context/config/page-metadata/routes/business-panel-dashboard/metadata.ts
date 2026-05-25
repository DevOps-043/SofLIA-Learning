import type { PageMetadata } from '../../types';
import { businessPanelDashboardComponents } from './components';
import { businessPanelDashboardApis } from './apis';
import { businessPanelDashboardUserFlows } from './user-flows';
import { businessPanelDashboardCommonIssues } from './common-issues';

export const businessPanelDashboardMetadata: PageMetadata = {
  route: '/[orgSlug]/business-panel/dashboard',
  routePattern: '/{orgSlug}/business-panel/dashboard',
  pageType: 'business_panel_dashboard',
  components: businessPanelDashboardComponents,
  apis: businessPanelDashboardApis,
  userFlows: businessPanelDashboardUserFlows,
  commonIssues: businessPanelDashboardCommonIssues,
};
