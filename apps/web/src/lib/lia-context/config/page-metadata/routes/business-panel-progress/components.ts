import type { ComponentInfo } from '../../types';

export const businessPanelProgressComponents: ComponentInfo[] = [
      {
        name: 'BusinessProgressPage',
        path: 'apps/web/src/app/[orgSlug]/business-panel/progress/page.tsx',
        description: 'Vista de progreso detallado de usuarios',
        props: [],
        commonErrors: [
          'Tabla no carga: Error en API de progreso',
          'Filtros no funcionan: Error en query'
        ]
      }
    ];
