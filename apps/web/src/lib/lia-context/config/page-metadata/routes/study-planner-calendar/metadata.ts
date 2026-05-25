import type { PageMetadata } from '../../types';
import { studyPlannerCalendarComponents } from './components';
import { studyPlannerCalendarApis } from './apis';
import { studyPlannerCalendarUserFlows } from './user-flows';
import { studyPlannerCalendarCommonIssues } from './common-issues';

export const studyPlannerCalendarMetadata: PageMetadata = {
  route: '/study-planner/calendar',
  routePattern: '/study-planner/calendar',
  pageType: 'study_planner_calendar',
  components: studyPlannerCalendarComponents,
  apis: studyPlannerCalendarApis,
  userFlows: studyPlannerCalendarUserFlows,
  commonIssues: studyPlannerCalendarCommonIssues,
};
