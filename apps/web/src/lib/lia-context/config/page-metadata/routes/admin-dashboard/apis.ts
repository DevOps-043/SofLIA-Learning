import type { ApiInfo } from '../../types';

export const adminDashboardApis: ApiInfo[] = [
      {
        endpoint: '/api/admin/dashboard/stats',
        method: 'GET',
        description: 'Obtiene estadísticas generales del dashboard',
        commonErrors: [
          '403 Forbidden: Usuario sin permisos de admin',
          '500 Internal Error: Error calculando estadísticas'
        ]
      },
      {
        endpoint: '/api/admin/activity/recent',
        method: 'GET',
        description: 'Obtiene actividad reciente de la plataforma',
        commonErrors: [
          '500 Internal Error: Error en query de actividad'
        ]
      }
    ];
