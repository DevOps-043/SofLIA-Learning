import type { ApiInfo } from '../../types';

export const adminCompaniesApis: ApiInfo[] = [
      {
        endpoint: '/api/admin/companies',
        method: 'GET',
        description: 'Obtiene lista de empresas',
        commonErrors: [
          '403 Forbidden: Sin permisos',
          '500 Internal Error: Error en query'
        ]
      },
      {
        endpoint: '/api/admin/companies',
        method: 'POST',
        description: 'Crea una nueva empresa',
        commonErrors: [
          '400 Bad Request: Datos inválidos o slug duplicado',
          '500 Internal Error: Error creando empresa'
        ]
      },
      {
        endpoint: '/api/admin/companies/[id]',
        method: 'PUT',
        description: 'Actualiza datos de empresa',
        commonErrors: [
          '404 Not Found: Empresa no existe',
          '400 Bad Request: Slug ya en uso'
        ]
      }
    ];
