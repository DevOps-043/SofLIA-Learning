import type { UserFlow } from '../../types';

export const mainDashboardUserFlows: UserFlow[] = [
      {
        name: 'Continuar aprendiendo',
        steps: ['1. Ver dashboard', '2. Identificar curso en progreso', '3. Click en "Continuar"', '4. Ir a lección actual'],
        commonBreakpoints: ['Paso 3: Error de redirección']
      }
    ];
