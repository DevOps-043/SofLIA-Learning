import type { UserFlow } from '../../types';

export const studyPlannerCalendarUserFlows: UserFlow[] = [
      {
        name: 'Ver y modificar plan',
        steps: ['1. Ver calendario con sesiones', '2. Arrastrar para reagendar', '3. Click para ver detalle'],
        commonBreakpoints: ['Paso 2: Evento no se mueve']
      }
    ];
