import type { PageMetadata } from '../../types';
import { businessPanelCoursesComponents } from './components';
import { businessPanelCoursesApis } from './apis';
import { businessPanelCoursesUserFlows } from './user-flows';
import { businessPanelCoursesCommonIssues } from './common-issues';

export const businessPanelCoursesMetadata: PageMetadata = {
  route: '/[orgSlug]/business-panel/courses',
  routePattern: '/{orgSlug}/business-panel/courses',
  pageType: 'business_panel_courses',
  components: businessPanelCoursesComponents,
  apis: businessPanelCoursesApis,
  userFlows: businessPanelCoursesUserFlows,
  commonIssues: businessPanelCoursesCommonIssues,
};
