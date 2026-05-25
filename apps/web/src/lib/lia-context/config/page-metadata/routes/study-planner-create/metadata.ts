import type { PageMetadata } from '../../types';
import { studyPlannerCreateComponents } from './components';
import { studyPlannerCreateApis } from './apis';
import { studyPlannerCreateUserFlows } from './user-flows';
import { studyPlannerCreateCommonIssues } from './common-issues';

export const studyPlannerCreateMetadata: PageMetadata = {
  route: '/study-planner/create',
  routePattern: '/study-planner/create',
  pageType: 'study_planner_create',
  components: studyPlannerCreateComponents,
  apis: studyPlannerCreateApis,
  userFlows: studyPlannerCreateUserFlows,
  commonIssues: studyPlannerCreateCommonIssues,
};
