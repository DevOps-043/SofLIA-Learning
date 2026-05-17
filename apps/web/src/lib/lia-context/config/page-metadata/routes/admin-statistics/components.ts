import type { ComponentInfo } from '../../types';

export const adminStatisticsComponents: ComponentInfo[] = [
      {
        name: 'AdminStatisticsPage',
        path: 'apps/web/src/app/admin/statistics/page.tsx',
        description: 'Estadísticas generales de la plataforma',
        props: [],
        commonErrors: ['Gráficos no cargan: Error de datos', 'Exportación falla']
      }
    ];
