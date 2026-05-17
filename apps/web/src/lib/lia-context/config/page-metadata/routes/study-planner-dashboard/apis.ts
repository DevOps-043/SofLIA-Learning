import type { ApiInfo } from '../../types';

export const studyPlannerDashboardApis: ApiInfo[] = [
      {
        endpoint: '/api/study-planner/active-plan',
        method: 'GET',
        description: 'Obtiene el plan de estudio activo del usuario',
        commonErrors: [
          '404 Not Found: Usuario sin plan activo'
        ]
      },
      {
        endpoint: '/api/study-planner/generate-plan',
        method: 'POST',
        description: 'Genera un nuevo plan de estudio con IA',
        commonErrors: [
          '400 Bad Request: Parámetros inválidos',
          '500 Internal Error: Error en generación de plan'
        ]
      },
      {
        endpoint: '/api/study-planner/save-plan',
        method: 'POST',
        description: 'Guarda el plan de estudio generado',
        commonErrors: [
          '400 Bad Request: Plan inválido',
          '500 Internal Error: Error al guardar'
        ]
      },
      {
        endpoint: '/api/study-planner/calendar/events',
        method: 'GET',
        description: 'Obtiene eventos del calendario conectado',
        commonErrors: [
          '401 Unauthorized: Token de calendario expirado',
          '403 Forbidden: Permisos insuficientes'
        ]
      }
    ];
