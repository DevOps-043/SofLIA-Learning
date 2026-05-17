import type { ComponentInfo } from '../../types';

export const adminLiaAnalyticsComponents: ComponentInfo[] = [
      {
        name: 'LiaAnalyticsPage',
        path: 'apps/web/src/app/admin/lia-analytics/page.tsx',
        description: 'Analytics y métricas de uso de LIA',
        props: [],
        commonErrors: [
          'Datos no cargan: Error en API de analytics',
          'Gráficos vacíos: No hay datos en el período'
        ]
      }
    ];
