import type { PageMetadata } from '../../types';
import { businessPanelReportsComponents } from './components';
import { businessPanelReportsApis } from './apis';
import { businessPanelReportsUserFlows } from './user-flows';
import { businessPanelReportsCommonIssues } from './common-issues';

export const businessPanelReportsMetadata: PageMetadata = {
  route: '/[orgSlug]/business-panel/reports',
  routePattern: '/{orgSlug}/business-panel/reports',
  pageType: 'business_panel_reports',
  components: businessPanelReportsComponents,
  apis: businessPanelReportsApis,
  userFlows: businessPanelReportsUserFlows,
  commonIssues: businessPanelReportsCommonIssues,
};
