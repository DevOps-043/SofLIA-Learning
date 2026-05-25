import type { UserFlow } from '../../types';

export const instructorDashboardUserFlows: UserFlow[] = [
      {
        name: 'Ver rendimiento de cursos',
        steps: ['1. Ver dashboard', '2. Seleccionar período', '3. Analizar métricas'],
        commonBreakpoints: ['Paso 2: Datos no disponibles']
      }
    ];
