import type { ApiInfo } from '../../types';

export const adminAccessRequestsApis: ApiInfo[] = [
      {
        endpoint: '/api/admin/community-requests',
        method: 'GET',
        description: 'Obtiene solicitudes de acceso pendientes',
        commonErrors: ['403 Forbidden: Sin permisos']
      }
    ];
