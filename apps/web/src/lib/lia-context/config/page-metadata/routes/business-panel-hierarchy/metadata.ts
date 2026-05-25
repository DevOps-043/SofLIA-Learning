import type { PageMetadata } from '../../types';
import { businessPanelHierarchyComponents } from './components';
import { businessPanelHierarchyApis } from './apis';
import { businessPanelHierarchyUserFlows } from './user-flows';
import { businessPanelHierarchyCommonIssues } from './common-issues';

export const businessPanelHierarchyMetadata: PageMetadata = {
  route: '/[orgSlug]/business-panel/hierarchy',
  routePattern: '/{orgSlug}/business-panel/hierarchy',
  pageType: 'business_panel_hierarchy',
  components: businessPanelHierarchyComponents,
  apis: businessPanelHierarchyApis,
  userFlows: businessPanelHierarchyUserFlows,
  commonIssues: businessPanelHierarchyCommonIssues,
};
