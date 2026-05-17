import type { PageMetadata } from '../../types';
import { appsDirectoryComponents } from './components';
import { appsDirectoryApis } from './apis';
import { appsDirectoryUserFlows } from './user-flows';
import { appsDirectoryCommonIssues } from './common-issues';

export const appsDirectoryMetadata: PageMetadata = {
  route: '/apps-directory',
  routePattern: '/apps-directory',
  pageType: 'apps_directory',
  components: appsDirectoryComponents,
  apis: appsDirectoryApis,
  userFlows: appsDirectoryUserFlows,
  commonIssues: appsDirectoryCommonIssues,
};
