import type { ComponentInfo } from '../../types';

export const authLoginComponents: ComponentInfo[] = [
      {
        name: 'AuthPage',
        path: 'apps/web/src/app/auth/page.tsx',
        description: 'Página de inicio de sesión',
        props: [],
        commonErrors: [
          'Login falla: Credenciales incorrectas',
          'OAuth no funciona: Error de configuración',
          'Página no carga: Error de servidor'
        ]
      },
      {
        name: 'LoginForm',
        path: 'apps/web/src/features/auth/components/LoginForm.tsx',
        description: 'Formulario de login con email/password',
        props: ['onSuccess', 'redirectTo'],
        commonErrors: ['Validación falla', 'Error de red al enviar']
      }
    ];
