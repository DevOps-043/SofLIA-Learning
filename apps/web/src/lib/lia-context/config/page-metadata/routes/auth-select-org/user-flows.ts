import type { UserFlow } from '../../types';

export const authSelectOrgUserFlows: UserFlow[] = [
      {
        name: 'Seleccionar organización',
        steps: ['1. Ver lista de organizaciones', '2. Click en la organización deseada', '3. Redirigir al dashboard de la org'],
        commonBreakpoints: ['Paso 2: Error de redirección']
      }
    ];
