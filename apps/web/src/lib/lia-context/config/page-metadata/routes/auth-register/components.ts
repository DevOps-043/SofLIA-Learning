import type { ComponentInfo } from '../../types';

export const authRegisterComponents: ComponentInfo[] = [
      {
        name: 'RegisterPage',
        path: 'apps/web/src/app/auth/[slug]/register/page.tsx',
        description: 'Página de registro de nuevos usuarios',
        props: [],
        commonErrors: ['Registro falla: Email ya existe', 'Validación de contraseña falla']
      },
      {
        name: 'RegisterForm',
        path: 'apps/web/src/features/auth/components/RegisterForm.tsx',
        description: 'Formulario de registro',
        props: ['organizationSlug', 'onSuccess'],
        commonErrors: ['Campos requeridos vacíos', 'Contraseña no cumple requisitos']
      }
    ];
