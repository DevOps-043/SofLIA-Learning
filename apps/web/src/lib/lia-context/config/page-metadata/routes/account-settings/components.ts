import type { ComponentInfo } from '../../types';

export const accountSettingsComponents: ComponentInfo[] = [
      {
        name: 'AccountSettingsPage',
        path: 'apps/web/src/app/account-settings/page.tsx',
        description: 'Configuración de cuenta del usuario',
        props: [],
        commonErrors: ['Settings no cargan', 'Error guardando preferencias']
      }
    ];
