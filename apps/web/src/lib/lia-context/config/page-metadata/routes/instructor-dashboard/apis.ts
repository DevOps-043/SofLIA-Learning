import type { ApiInfo } from '../../types';

export const instructorDashboardApis: ApiInfo[] = [
      {
        endpoint: '/api/instructor/dashboard',
        method: 'GET',
        description: 'Obtiene stats del instructor',
        commonErrors: ['403: No es instructor']
      }
    ];
