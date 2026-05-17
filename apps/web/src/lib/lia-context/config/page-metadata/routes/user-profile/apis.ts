import type { ApiInfo } from '../../types';

export const userProfileApis: ApiInfo[] = [
      {
        endpoint: '/api/profile',
        method: 'GET',
        description: 'Obtiene datos del perfil',
        commonErrors: ['401 Unauthorized: No autenticado']
      },
      {
        endpoint: '/api/profile',
        method: 'PUT',
        description: 'Actualiza datos del perfil',
        commonErrors: ['400 Bad Request: Datos inválidos']
      },
      {
        endpoint: '/api/profile/avatar',
        method: 'POST',
        description: 'Sube foto de perfil',
        commonErrors: ['413: Archivo muy grande', '415: Formato no soportado']
      }
    ];
