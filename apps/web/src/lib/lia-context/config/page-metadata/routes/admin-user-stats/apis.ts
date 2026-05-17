import type { ApiInfo } from '../../types';

export const adminUserStatsApis: ApiInfo[] = [
      {
        endpoint: '/api/admin/user-stats',
        method: 'GET',
        description: 'Obtiene estadísticas de usuarios',
        commonErrors: ['403 Forbidden: Sin permisos']
      }
    ];
