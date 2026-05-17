import type { ApiInfo } from '../../types';

export const businessUserDashboardApis: ApiInfo[] = [
      {
        endpoint: '/api/[orgSlug]/business-user/dashboard',
        method: 'GET',
        description: 'Obtiene datos del dashboard del usuario',
        commonErrors: [
          '401 Unauthorized: Usuario no autenticado',
          '403 Forbidden: Usuario no pertenece a esta organización'
        ]
      }
    ];
