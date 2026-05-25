import type { UserFlow } from '../../types';

export const authForgotPasswordUserFlows: UserFlow[] = [
      {
        name: 'Recuperar contraseña',
        steps: ['1. Ingresar email registrado', '2. Click en "Enviar"', '3. Revisar email', '4. Seguir link de recuperación'],
        commonBreakpoints: ['Paso 3: Email no llega']
      }
    ];
