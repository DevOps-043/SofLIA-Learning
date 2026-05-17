import type { UserFlow } from '../../types';

export const authRegisterUserFlows: UserFlow[] = [
      {
        name: 'Registrarse como nuevo usuario',
        steps: [
          '1. Ingresar email',
          '2. Crear contraseña segura',
          '3. Completar datos personales',
          '4. Aceptar términos y condiciones',
          '5. Click en "Crear Cuenta"',
          '6. Verificar email si es requerido'
        ],
        commonBreakpoints: [
          'Paso 2: Contraseña no cumple requisitos',
          'Paso 5: Email ya existe',
          'Paso 6: Email no llega'
        ]
      }
    ];
