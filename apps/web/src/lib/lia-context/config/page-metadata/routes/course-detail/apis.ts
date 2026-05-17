import type { ApiInfo } from '../../types';

export const courseDetailApis: ApiInfo[] = [
      {
        endpoint: '/api/courses/[slug]',
        method: 'GET',
        description: 'Obtiene detalle del curso',
        commonErrors: ['404: Curso no encontrado']
      }
    ];
