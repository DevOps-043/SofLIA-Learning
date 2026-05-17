import type { ApiInfo } from '../../types';

export const authSelectOrgApis: ApiInfo[] = [
      {
        endpoint: '/api/organizations',
        method: 'GET',
        description: 'Obtiene organizaciones del usuario',
        commonErrors: ['500: Error de BD']
      }
    ];
