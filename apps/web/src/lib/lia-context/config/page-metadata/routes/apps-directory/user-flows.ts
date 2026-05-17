import type { UserFlow } from '../../types';

export const appsDirectoryUserFlows: UserFlow[] = [
      {
        name: 'Buscar aplicación de IA',
        steps: ['1. Usar buscador o filtros', '2. Ver resultados', '3. Click en app para ver detalle'],
        commonBreakpoints: ['Paso 2: Sin resultados']
      }
    ];
