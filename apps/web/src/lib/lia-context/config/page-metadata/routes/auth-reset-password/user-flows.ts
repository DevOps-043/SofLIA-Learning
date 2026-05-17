import type { UserFlow } from '../../types';

export const authResetPasswordUserFlows: UserFlow[] = [
      {
        name: 'Establecer nueva contraseña',
        steps: ['1. Ingresar nueva contraseña', '2. Confirmar contraseña', '3. Click en "Guardar"', '4. Redirigir a login'],
        commonBreakpoints: ['Paso 1: Requisitos no cumplidos']
      }
    ];
