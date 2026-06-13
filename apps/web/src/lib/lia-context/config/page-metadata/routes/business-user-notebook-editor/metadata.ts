import type { PageMetadata } from '../../types';
import { businessUserNotebookEditorComponents } from './components';
import { businessUserNotebookEditorApis } from './apis';
import { businessUserNotebookEditorUserFlows } from './user-flows';
import { businessUserNotebookEditorCommonIssues } from './common-issues';

export const businessUserNotebookEditorMetadata: PageMetadata = {
  route: '/[orgSlug]/business-user/notebook/[noteId]',
  routePattern: '/{orgSlug}/business-user/notebook/{noteId}',
  pageType: 'business_user_notebook_editor',
  components: businessUserNotebookEditorComponents,
  apis: businessUserNotebookEditorApis,
  userFlows: businessUserNotebookEditorUserFlows,
  commonIssues: businessUserNotebookEditorCommonIssues,
};
