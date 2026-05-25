import type { UserFlow } from '../../types';

export const authLoginUserFlows: UserFlow[] = [
      {
        name: 'Iniciar sesión con email',
        steps: [
          '1. Ingresar email',
          '2. Ingresar contraseña',
          '3. Click en "Iniciar Sesión"',
          '4. Redirigir a dashboard'
        ],
        commonBreakpoints: [
          'Paso 3: Credenciales incorrectas',
          'Paso 4: Redireccion falla'
        ]
      },
      {
        name: 'Iniciar sesión con OAuth',
        steps: [
          '1. Click en botón de proveedor (Google/Microsoft)',
          '2. Autorizar en ventana de OAuth',
          '3. Redirigir de vuelta a la plataforma',
          '4. Sesión iniciada'
        ],
        commonBreakpoints: [
          'Paso 2: Ventana se cierra inesperadamente',
          'Paso 3: Error de callback'
        ]
      }
    ];
