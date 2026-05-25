import type { ApiInfo } from '../../types';

export const businessPanelProgressApis: ApiInfo[] = [
      {
        endpoint: '/api/[orgSlug]/business/progress',
        method: 'GET',
        description: 'Obtiene progreso de todos los usuarios',
        commonErrors: [
          '403 Forbidden: Sin permisos'
        ]
      }
    ];
