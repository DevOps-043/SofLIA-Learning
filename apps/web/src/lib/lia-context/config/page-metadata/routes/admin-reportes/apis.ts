import type { ApiInfo } from '../../types';

export const adminReportesApis: ApiInfo[] = [
      {
        endpoint: '/api/admin/reportes',
        method: 'GET',
        description: 'Obtiene lista de reportes de problemas',
        commonErrors: [
          '403 Forbidden: Sin permisos de admin'
        ]
      },
      {
        endpoint: '/api/admin/reportes/[id]',
        method: 'PUT',
        description: 'Actualiza estado/prioridad del reporte',
        commonErrors: [
          '404 Not Found: Reporte no existe',
          '400 Bad Request: Estado inválido'
        ]
      }
    ];
