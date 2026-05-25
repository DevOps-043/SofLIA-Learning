import type { ApiInfo } from '../../types';

export const businessPanelDashboardApis: ApiInfo[] = [
      {
        endpoint: '/api/[orgSlug]/business/dashboard',
        method: 'GET',
        description: 'Obtiene estadísticas del dashboard empresarial',
        commonErrors: [
          '403 Forbidden: Sin permisos de business-panel',
          '404 Not Found: Organización no existe'
        ]
      }
    ];
