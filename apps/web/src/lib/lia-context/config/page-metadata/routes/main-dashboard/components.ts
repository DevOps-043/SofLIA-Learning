import type { ComponentInfo } from '../../types';

export const mainDashboardComponents: ComponentInfo[] = [
      {
        name: 'DashboardPage',
        path: 'apps/web/src/app/dashboard/page.tsx',
        description: 'Dashboard principal del usuario',
        props: [],
        commonErrors: ['Dashboard no carga', 'Widgets vacíos', 'Cursos no aparecen']
      },
      {
        name: 'CourseProgress',
        path: 'apps/web/src/features/dashboard/components/CourseProgress.tsx',
        description: 'Widget de progreso de cursos',
        props: ['courses'],
        commonErrors: ['Progreso incorrecto', 'No muestra cursos']
      },
      {
        name: 'RecentActivity',
        path: 'apps/web/src/features/dashboard/components/RecentActivity.tsx',
        description: 'Widget de actividad reciente',
        props: ['activities'],
        commonErrors: ['Actividad no carga']
      }
    ];
