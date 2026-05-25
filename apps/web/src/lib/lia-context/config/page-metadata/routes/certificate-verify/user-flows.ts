import type { UserFlow } from '../../types';

export const certificateVerifyUserFlows: UserFlow[] = [
      {
        name: 'Verificar certificado',
        steps: ['1. Ingresar código del certificado', '2. Click en "Verificar"', '3. Ver resultado'],
        commonBreakpoints: ['Paso 2: Código inválido']
      }
    ];
