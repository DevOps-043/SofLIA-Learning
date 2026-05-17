import type { UserFlow } from '../../types';

export const adminLiaAnalyticsUserFlows: UserFlow[] = [
      {
        name: 'Analizar uso de LIA',
        steps: [
          '1. Seleccionar rango de fechas',
          '2. Ver métricas generales',
          '3. Revisar conversaciones populares',
          '4. Exportar datos si es necesario'
        ],
        commonBreakpoints: [
          'Paso 2: Métricas no cargan',
          'Paso 4: Error al exportar'
        ]
      }
    ];
