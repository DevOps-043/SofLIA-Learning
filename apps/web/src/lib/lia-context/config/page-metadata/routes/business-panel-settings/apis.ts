import type { ApiInfo } from '../../types';

export const businessPanelSettingsApis: ApiInfo[] = [
      {
        endpoint: '/api/[orgSlug]/business/settings',
        method: 'GET',
        description: 'Obtiene configuración de la organización',
        commonErrors: [
          '403 Forbidden: Sin permisos de admin'
        ]
      },
      {
        endpoint: '/api/[orgSlug]/business/settings',
        method: 'PUT',
        description: 'Actualiza configuración',
        commonErrors: [
          '400 Bad Request: Datos inválidos'
        ]
      }
    ];
