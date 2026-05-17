import type { ComponentInfo } from '../../types';

export const adminUserStatsComponents: ComponentInfo[] = [
      {
        name: 'AdminUserStatsPage',
        path: 'apps/web/src/app/admin/user-stats/page.tsx',
        description: 'Estadísticas detalladas de usuarios',
        props: [],
        commonErrors: ['Datos no cargan: Error en API', 'Búsqueda no funciona']
      }
    ];
