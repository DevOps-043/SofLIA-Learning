import type { ComponentInfo } from '../../types';

export const authResetPasswordComponents: ComponentInfo[] = [
      {
        name: 'ResetPasswordPage',
        path: 'apps/web/src/app/auth/reset-password/page.tsx',
        description: 'Página para establecer nueva contraseña',
        props: [],
        commonErrors: ['Token inválido o expirado', 'Contraseña no cumple requisitos']
      }
    ];
