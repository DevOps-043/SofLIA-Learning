import type { ComponentInfo } from '../../types';

export const adminDashboardComponents: ComponentInfo[] = [
      {
        name: 'AdminDashboardPage',
        path: 'apps/web/src/app/admin/dashboard/page.tsx',
        description: 'Dashboard principal del panel de administración',
        props: [],
        commonErrors: [
          'Estadísticas no cargan: Error en API de stats',
          'Gráficos vacíos: No hay datos para el período seleccionado'
        ]
      },
      {
        name: 'AdminHeader',
        path: 'apps/web/src/features/admin/components/AdminHeader.tsx',
        description: 'Header del panel de administración con navegación',
        props: [],
        commonErrors: [
          'Navegación no responde: Verificar rutas de admin'
        ]
      }
    ];
