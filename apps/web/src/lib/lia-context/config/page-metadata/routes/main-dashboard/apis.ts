import type { ApiInfo } from '../../types';

export const mainDashboardApis: ApiInfo[] = [
      {
        endpoint: '/api/my-courses',
        method: 'GET',
        description: 'Obtiene cursos del usuario',
        commonErrors: ['401: No autenticado']
      }
    ];
