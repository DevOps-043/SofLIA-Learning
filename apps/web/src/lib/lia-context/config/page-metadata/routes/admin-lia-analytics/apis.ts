import type { ApiInfo } from '../../types';

export const adminLiaAnalyticsApis: ApiInfo[] = [
      {
        endpoint: '/api/admin/lia-analytics',
        method: 'GET',
        description: 'Obtiene métricas de uso de LIA',
        commonErrors: [
          '403 Forbidden: Sin permisos',
          '500 Internal Error: Error calculando métricas'
        ]
      }
    ];
