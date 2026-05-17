import type { UserFlow } from '../../types';

export const businessPanelProgressUserFlows: UserFlow[] = [
      {
        name: 'Revisar progreso de equipo',
        steps: [
          '1. Seleccionar equipo o zona',
          '2. Ver tabla de progreso',
          '3. Ordenar por criterio',
          '4. Ver detalle de usuario individual'
        ],
        commonBreakpoints: [
          'Paso 2: Tabla vacía',
          'Paso 4: Modal no abre'
        ]
      }
    ];
