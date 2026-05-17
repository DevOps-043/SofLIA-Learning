import type { ApiInfo } from '../../types';

export const courseLearnApis: ApiInfo[] = [
      {
        endpoint: '/api/courses/[slug]/lessons/[lessonId]/progress',
        method: 'POST',
        description: 'Guarda progreso de la lección',
        commonErrors: [
          '401 Unauthorized: Sesión expirada',
          '404 Not Found: Lección no encontrada'
        ]
      },
      {
        endpoint: '/api/courses/[slug]/lessons/[lessonId]/activities',
        method: 'GET',
        description: 'Obtiene actividades de la lección',
        commonErrors: [
          '404 Not Found: Lección sin actividades'
        ]
      },
      {
        endpoint: '/api/lia/chat',
        method: 'POST',
        description: 'Chat con SofLIA en contexto de lección',
        commonErrors: [
          '500 Internal Error: Error en API de IA',
          '429 Too Many Requests: Límite de requests alcanzado'
        ]
      }
    ];
