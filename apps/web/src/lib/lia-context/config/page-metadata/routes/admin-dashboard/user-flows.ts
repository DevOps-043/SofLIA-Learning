import type { UserFlow } from '../../types';

export const adminDashboardUserFlows: UserFlow[] = [
      {
        name: 'Revisar métricas del día',
        steps: [
          '1. Acceder al dashboard de admin',
          '2. Ver widgets de estadísticas',
          '3. Filtrar por rango de fechas si es necesario',
          '4. Exportar datos si se requiere'
        ],
        commonBreakpoints: [
          'Paso 2: Widgets no cargan datos',
          'Paso 4: Error al exportar'
        ]
      }
    ];
