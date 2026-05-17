import type { PageMetadata } from '../../types';
import { instructorCoursesComponents } from './components';
import { instructorCoursesApis } from './apis';
import { instructorCoursesUserFlows } from './user-flows';
import { instructorCoursesCommonIssues } from './common-issues';

export const instructorCoursesMetadata: PageMetadata = {
  route: '/instructor/courses',
  routePattern: '/instructor/courses',
  pageType: 'instructor_courses',
  components: instructorCoursesComponents,
  apis: instructorCoursesApis,
  userFlows: instructorCoursesUserFlows,
  commonIssues: instructorCoursesCommonIssues,
};
