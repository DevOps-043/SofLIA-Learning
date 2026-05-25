import type { PageMetadata } from '../../types';
import { businessPanelProgressComponents } from './components';
import { businessPanelProgressApis } from './apis';
import { businessPanelProgressUserFlows } from './user-flows';
import { businessPanelProgressCommonIssues } from './common-issues';

export const businessPanelProgressMetadata: PageMetadata = {
  route: '/[orgSlug]/business-panel/progress',
  routePattern: '/{orgSlug}/business-panel/progress',
  pageType: 'business_panel_progress',
  components: businessPanelProgressComponents,
  apis: businessPanelProgressApis,
  userFlows: businessPanelProgressUserFlows,
  commonIssues: businessPanelProgressCommonIssues,
};
