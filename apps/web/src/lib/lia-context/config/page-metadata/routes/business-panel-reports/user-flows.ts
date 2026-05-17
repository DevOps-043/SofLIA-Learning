import type { UserFlow } from '../../types';

export const businessPanelReportsUserFlows: UserFlow[] = [
      {
        name: 'Abrir panel unificado',
        steps: [
          '1. Navegar a Reportes y Analytics en el Business Panel',
          '2. Usar la nueva superficie unificada como base de reconstrucción'
        ],
        commonBreakpoints: [
          'Paso 1: la ruta antigua de analytics debe redirigir a reports'
        ]
      }
    ];
