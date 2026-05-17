import type { ApiInfo } from '../../types';

export const adminStatisticsApis: ApiInfo[] = [
      {
        endpoint: '/api/admin/statistics',
        method: 'GET',
        description: 'Obtiene estadísticas de la plataforma',
        commonErrors: ['500 Internal Error: Error calculando stats']
      }
    ];
