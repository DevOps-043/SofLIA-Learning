import type { UserFlow } from '../../types';

export const accountSettingsUserFlows: UserFlow[] = [
      {
        name: 'Cambiar configuración',
        steps: ['1. Navegar a la sección deseada', '2. Modificar preferencias', '3. Guardar cambios'],
        commonBreakpoints: ['Paso 3: Error de API']
      }
    ];
