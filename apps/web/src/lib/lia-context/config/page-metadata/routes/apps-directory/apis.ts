import type { ApiInfo } from '../../types';

export const appsDirectoryApis: ApiInfo[] = [
      {
        endpoint: '/api/ai-directory/apps',
        method: 'GET',
        description: 'Obtiene lista de apps de IA',
        commonErrors: ['500: Error de BD']
      }
    ];
