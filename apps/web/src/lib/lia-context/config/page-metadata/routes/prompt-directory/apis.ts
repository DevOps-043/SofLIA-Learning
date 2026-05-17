import type { ApiInfo } from '../../types';

export const promptDirectoryApis: ApiInfo[] = [
      {
        endpoint: '/api/ai-directory/prompts',
        method: 'GET',
        description: 'Obtiene lista de prompts',
        commonErrors: ['500: Error de BD']
      }
    ];
