import type { PageMetadata } from '../../types';
import { adminReportesComponents } from './components';
import { adminReportesApis } from './apis';
import { adminReportesUserFlows } from './user-flows';
import { adminReportesCommonIssues } from './common-issues';

export const adminReportesMetadata: PageMetadata = {
  route: '/admin/reportes',
  routePattern: '/admin/reportes',
  pageType: 'admin_reportes',
  components: adminReportesComponents,
  apis: adminReportesApis,
  userFlows: adminReportesUserFlows,
  commonIssues: adminReportesCommonIssues,
};
