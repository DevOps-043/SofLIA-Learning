import type { UserFlow } from '../../types';

export const adminUserStatsUserFlows: UserFlow[] = [
      {
        name: 'Analizar usuario específico',
        steps: ['1. Buscar usuario', '2. Ver métricas de actividad', '3. Ver progreso en cursos', '4. Exportar datos si es necesario'],
        commonBreakpoints: ['Paso 2: Datos no disponibles']
      }
    ];
