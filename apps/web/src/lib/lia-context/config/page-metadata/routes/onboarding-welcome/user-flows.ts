import type { UserFlow } from '../../types';

export const onboardingWelcomeUserFlows: UserFlow[] = [
      {
        name: 'Completar onboarding',
        steps: ['1. Ver bienvenida', '2. Responder cuestionario', '3. Ir al dashboard'],
        commonBreakpoints: ['Paso 2: Preguntas no cargan']
      }
    ];
