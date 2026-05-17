import type { UserFlow } from '../../types';

export const adminStatisticsUserFlows: UserFlow[] = [
      {
        name: 'Exportar reporte de estadísticas',
        steps: ['1. Seleccionar rango de fechas', '2. Elegir métricas a incluir', '3. Click en "Exportar"', '4. Descargar archivo'],
        commonBreakpoints: ['Paso 3: Error generando archivo']
      }
    ];
