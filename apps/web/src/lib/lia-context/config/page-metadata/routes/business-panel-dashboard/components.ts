import type { ComponentInfo } from '../../types';

export const businessPanelDashboardComponents: ComponentInfo[] = [
      {
        name: 'BusinessDashboardPage',
        path: 'apps/web/src/app/[orgSlug]/business-panel/dashboard/page.tsx',
        description: 'Dashboard principal del panel empresarial',
        props: [],
        commonErrors: [
          'Estadísticas no cargan: Error en API de stats',
          'Widgets vacíos: No hay datos de la organización'
        ]
      }
    ];
