import type { ApiInfo } from '../../types';

export const instructorNewCourseApis: ApiInfo[] = [
      {
        endpoint: '/api/instructor/courses',
        method: 'POST',
        description: 'Crea nuevo curso',
        commonErrors: ['400: Datos inválidos', '403: No es instructor']
      }
    ];
