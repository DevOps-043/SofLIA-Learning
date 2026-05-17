import type { UserFlow } from '../../types';

export const studyPlannerCreateUserFlows: UserFlow[] = [
      {
        name: 'Crear plan personalizado',
        steps: ['1. Conversar con LIA sobre preferencias', '2. LIA genera plan', '3. Revisar y ajustar', '4. Guardar plan'],
        commonBreakpoints: ['Paso 2: Plan no adecuado', 'Paso 4: Error guardando']
      }
    ];
