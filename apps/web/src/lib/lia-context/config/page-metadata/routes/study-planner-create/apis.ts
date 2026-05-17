import type { ApiInfo } from '../../types';

export const studyPlannerCreateApis: ApiInfo[] = [
      {
        endpoint: '/api/study-planner/generate-plan',
        method: 'POST',
        description: 'Genera plan con IA',
        commonErrors: ['500: Error de IA', '400: Datos insuficientes']
      }
    ];
