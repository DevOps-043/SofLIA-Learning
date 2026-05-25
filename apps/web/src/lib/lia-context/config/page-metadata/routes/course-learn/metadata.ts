import type { PageMetadata } from '../../types';
import { courseLearnComponents } from './components';
import { courseLearnApis } from './apis';
import { courseLearnUserFlows } from './user-flows';
import { courseLearnCommonIssues } from './common-issues';

export const courseLearnMetadata: PageMetadata = {
  route: '/courses/[slug]/learn',
  routePattern: '/courses/{slug}/learn',
  pageType: 'course_learn',
  components: courseLearnComponents,
  apis: courseLearnApis,
  userFlows: courseLearnUserFlows,
  commonIssues: courseLearnCommonIssues,
};
