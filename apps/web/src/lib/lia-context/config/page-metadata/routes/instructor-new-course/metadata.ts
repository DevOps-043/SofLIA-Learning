import type { PageMetadata } from '../../types';
import { instructorNewCourseComponents } from './components';
import { instructorNewCourseApis } from './apis';
import { instructorNewCourseUserFlows } from './user-flows';
import { instructorNewCourseCommonIssues } from './common-issues';

export const instructorNewCourseMetadata: PageMetadata = {
  route: '/instructor/courses/new',
  routePattern: '/instructor/courses/new',
  pageType: 'instructor_new_course',
  components: instructorNewCourseComponents,
  apis: instructorNewCourseApis,
  userFlows: instructorNewCourseUserFlows,
  commonIssues: instructorNewCourseCommonIssues,
};
