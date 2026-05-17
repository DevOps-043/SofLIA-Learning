import type { ApiInfo } from '../../types';

export const businessPanelHierarchyApis: ApiInfo[] = [
      {
        endpoint: '/api/[orgSlug]/business/hierarchy',
        method: 'GET',
        description: 'Obtiene estructura jerárquica',
        commonErrors: [
          '403 Forbidden: Sin permisos'
        ]
      },
      {
        endpoint: '/api/[orgSlug]/business/hierarchy/teams',
        method: 'POST',
        description: 'Crea un nuevo equipo',
        commonErrors: [
          '400 Bad Request: Nombre duplicado'
        ]
      }
    ];
