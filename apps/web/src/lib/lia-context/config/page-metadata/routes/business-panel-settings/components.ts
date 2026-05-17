import type { ComponentInfo } from '../../types';

export const businessPanelSettingsComponents: ComponentInfo[] = [
      {
        name: 'BusinessSettingsPage',
        path: 'apps/web/src/app/[orgSlug]/business-panel/settings/page.tsx',
        description: 'Configuración de la organización',
        props: [],
        commonErrors: [
          'Configuración no carga: Error en API',
          'Logo no sube: Error de storage'
        ]
      }
    ];
