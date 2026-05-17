import type { ApiInfo } from '../../types';

export const instructorCoursesApis: ApiInfo[] = [
      {
        endpoint: '/api/instructor/courses',
        method: 'GET',
        description: 'Obtiene cursos del instructor',
        commonErrors: ['403: No es instructor']
      }
    ];
