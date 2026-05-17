import type { ComponentInfo } from '../../types';

export const businessPanelReportsComponents: ComponentInfo[] = [
      {
        name: 'BusinessReportsAnalytics',
        path: 'apps/web/src/features/business-panel/components/BusinessReportsAnalytics.tsx',
        description: 'Panel unificado nuevo para reconstruir reportes, analytics y exportaciones',
        props: [],
        commonErrors: [
          'Vista no carga: verificar la ruta del Business Panel',
          'Texto faltante: revisar llaves reportsAnalytics en business.json'
        ]
      }
    ];
