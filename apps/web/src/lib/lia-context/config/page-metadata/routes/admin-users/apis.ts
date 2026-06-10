import type { ApiInfo } from '../../types';

export const adminUsersApis: ApiInfo[] = [
      {
        endpoint: '/api/admin/users',
        method: 'GET',
        description: 'Obtiene lista paginada de usuarios',
        commonErrors: [
          '403 Forbidden: Sin permisos de admin',
          '500 Internal Error: Error en query de BD'
        ]
      },
      {
        endpoint: '/api/admin/users/[id]',
        method: 'PUT',
        description: 'Actualiza datos de un usuario',
        commonErrors: [
          '404 Not Found: Usuario no existe',
          '400 Bad Request: Datos inválidos'
        ]
      },
      {
        endpoint: '/api/admin/users/[id]',
        method: 'DELETE',
        description: 'Elimina un usuario y sus datos',
        commonErrors: [
          '403 Forbidden: No se puede eliminar este usuario',
          '500 Internal Error: Error eliminando datos relacionados'
        ]
      }
    ];
