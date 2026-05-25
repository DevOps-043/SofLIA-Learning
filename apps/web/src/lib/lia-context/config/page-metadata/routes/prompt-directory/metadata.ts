import type { PageMetadata } from '../../types';
import { promptDirectoryComponents } from './components';
import { promptDirectoryApis } from './apis';
import { promptDirectoryUserFlows } from './user-flows';
import { promptDirectoryCommonIssues } from './common-issues';

export const promptDirectoryMetadata: PageMetadata = {
  route: '/prompt-directory',
  routePattern: '/prompt-directory',
  pageType: 'prompt_directory',
  components: promptDirectoryComponents,
  apis: promptDirectoryApis,
  userFlows: promptDirectoryUserFlows,
  commonIssues: promptDirectoryCommonIssues,
};
