import type { ApiInfo } from '../../types';

export const businessUserAnalyticsApis: ApiInfo[] = [
  {
    endpoint: '/api/[orgSlug]/business-user/analytics',
    method: 'GET',
    description:
      'Obtiene las métricas personales del usuario (progreso, adopción de IA, calidad, notas, actividades, quizzes y mapa de actividad) según el rango de tiempo seleccionado.',
    commonErrors: [
      '401 Unauthorized: usuario no autenticado',
      '403 Forbidden: el usuario no pertenece a esta organización',
    ],
  },
  {
    endpoint: '/api/[orgSlug]/business-user/analytics/insights',
    method: 'POST',
    description:
      'Genera con IA una retroalimentación personalizada (fortalezas, oportunidades, recomendaciones y próximos pasos) a partir de las métricas del usuario.',
    commonErrors: [
      '503 Service Unavailable: el servicio de IA no está disponible temporalmente',
    ],
  },
];
