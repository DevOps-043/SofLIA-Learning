import type { ApiInfo } from '../../types';

export const businessPanelUsersApis: ApiInfo[] = [
      {
        endpoint: '/api/business/users',
        method: 'GET',
        description: 'Obtiene lista de usuarios de la organización',
        commonErrors: [
          '403 Forbidden: Sin permisos de administrador',
          '500 Internal Error: Error en query de BD'
        ]
      },
      {
        endpoint: '/api/business/users',
        method: 'POST',
        description: 'Crea un nuevo usuario en la organización',
        commonErrors: [
          '400 Bad Request: Datos inválidos',
          '409 Conflict: Email ya existe'
        ]
      },
      {
        endpoint: '/api/business/users/[userId]/stats',
        method: 'GET',
        description: 'Obtiene estadísticas de un usuario específico',
        commonErrors: [
          '404 Not Found: Usuario no encontrado',
          '403 Forbidden: Sin permisos para ver este usuario'
        ]
      }
    ];
