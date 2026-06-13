import type { PageMetadata } from '../../types';
import { businessUserNotebookComponents } from './components';
import { businessUserNotebookApis } from './apis';
import { businessUserNotebookUserFlows } from './user-flows';
import { businessUserNotebookCommonIssues } from './common-issues';

export const businessUserNotebookMetadata: PageMetadata = {
  route: '/[orgSlug]/business-user/notebook',
  routePattern: '/{orgSlug}/business-user/notebook',
  pageType: 'business_user_notebook',
  components: businessUserNotebookComponents,
  apis: businessUserNotebookApis,
  userFlows: businessUserNotebookUserFlows,
  commonIssues: businessUserNotebookCommonIssues,
};
