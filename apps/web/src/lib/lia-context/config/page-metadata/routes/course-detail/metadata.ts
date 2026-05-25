import type { PageMetadata } from '../../types';
import { courseDetailComponents } from './components';
import { courseDetailApis } from './apis';
import { courseDetailUserFlows } from './user-flows';
import { courseDetailCommonIssues } from './common-issues';

export const courseDetailMetadata: PageMetadata = {
  route: '/courses/[slug]',
  routePattern: '/courses/{slug}',
  pageType: 'course_detail',
  components: courseDetailComponents,
  apis: courseDetailApis,
  userFlows: courseDetailUserFlows,
  commonIssues: courseDetailCommonIssues,
};
