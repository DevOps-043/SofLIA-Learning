import type { ApiInfo } from '../../types';

export const adminWorkshopsApis: ApiInfo[] = [
      {
        endpoint: '/api/admin/workshops',
        method: 'GET',
        description: 'Obtiene lista de talleres',
        commonErrors: ['403 Forbidden: Sin permisos']
      },
      {
        endpoint: '/api/admin/workshops',
        method: 'POST',
        description: 'Crea un nuevo taller',
        commonErrors: ['400 Bad Request: Datos inválidos', '500: Error creando evento']
      }
    ];
