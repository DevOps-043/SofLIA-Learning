import type { UserFlow } from '../../types';

export const businessPanelDashboardUserFlows: UserFlow[] = [
      {
        name: 'Ver métricas de la organización',
        steps: [
          '1. Acceder al dashboard',
          '2. Ver widgets de progreso de usuarios',
          '3. Revisar cursos más populares',
          '4. Ver actividad reciente'
        ],
        commonBreakpoints: [
          'Paso 2: Datos no cargan',
          'Paso 3: Lista vacía'
        ]
      }
    ];
