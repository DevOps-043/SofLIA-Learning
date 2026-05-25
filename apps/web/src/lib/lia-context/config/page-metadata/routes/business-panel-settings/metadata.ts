import type { PageMetadata } from '../../types';
import { businessPanelSettingsComponents } from './components';
import { businessPanelSettingsApis } from './apis';
import { businessPanelSettingsUserFlows } from './user-flows';
import { businessPanelSettingsCommonIssues } from './common-issues';

export const businessPanelSettingsMetadata: PageMetadata = {
  route: '/[orgSlug]/business-panel/settings',
  routePattern: '/{orgSlug}/business-panel/settings',
  pageType: 'business_panel_settings',
  components: businessPanelSettingsComponents,
  apis: businessPanelSettingsApis,
  userFlows: businessPanelSettingsUserFlows,
  commonIssues: businessPanelSettingsCommonIssues,
};
