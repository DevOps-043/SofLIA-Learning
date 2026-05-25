import type { ComponentInfo } from '../../types';

export const authForgotPasswordComponents: ComponentInfo[] = [
      {
        name: 'ForgotPasswordPage',
        path: 'apps/web/src/app/auth/forgot-password/page.tsx',
        description: 'Página de recuperación de contraseña',
        props: [],
        commonErrors: ['Email no encontrado', 'Error enviando email']
      }
    ];
