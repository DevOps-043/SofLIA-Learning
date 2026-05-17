import type { ComponentInfo } from '../../types';

export const userProfileComponents: ComponentInfo[] = [
      {
        name: 'ProfilePage',
        path: 'apps/web/src/app/profile/page.tsx',
        description: 'Página de perfil del usuario',
        props: [],
        commonErrors: [
          'Perfil no carga: Error de autenticación',
          'Foto no sube: Error de storage',
          'Cambios no guardan: Error de API'
        ]
      },
      {
        name: 'ProfileForm',
        path: 'apps/web/src/features/profile/components/ProfileForm.tsx',
        description: 'Formulario de edición de perfil',
        props: ['user', 'onSave'],
        commonErrors: ['Validación falla', 'Error guardando cambios']
      }
    ];
