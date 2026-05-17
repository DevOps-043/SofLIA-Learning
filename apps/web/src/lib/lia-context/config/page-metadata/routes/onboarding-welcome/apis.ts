import type { ApiInfo } from '../../types';

export const onboardingWelcomeApis: ApiInfo[] = [
      {
        endpoint: '/api/questionnaire',
        method: 'POST',
        description: 'Guarda respuestas del cuestionario',
        commonErrors: ['400: Respuestas incompletas']
      }
    ];
