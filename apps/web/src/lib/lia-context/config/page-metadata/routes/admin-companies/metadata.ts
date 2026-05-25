import type { PageMetadata } from '../../types';
import { adminCompaniesComponents } from './components';
import { adminCompaniesApis } from './apis';
import { adminCompaniesUserFlows } from './user-flows';
import { adminCompaniesCommonIssues } from './common-issues';

export const adminCompaniesMetadata: PageMetadata = {
  route: '/admin/companies',
  routePattern: '/admin/companies',
  pageType: 'admin_companies',
  components: adminCompaniesComponents,
  apis: adminCompaniesApis,
  userFlows: adminCompaniesUserFlows,
  commonIssues: adminCompaniesCommonIssues,
};
