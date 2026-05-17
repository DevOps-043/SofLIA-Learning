import type { ApiInfo } from '../../types';

export const studyPlannerCalendarApis: ApiInfo[] = [
      {
        endpoint: '/api/study-planner/calendar/events',
        method: 'GET',
        description: 'Obtiene eventos del calendario',
        commonErrors: ['401: Token expirado']
      }
    ];
