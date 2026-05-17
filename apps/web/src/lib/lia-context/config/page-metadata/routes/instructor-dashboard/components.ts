import type { ComponentInfo } from '../../types';

export const instructorDashboardComponents: ComponentInfo[] = [
      {
        name: 'InstructorDashboardPage',
        path: 'apps/web/src/app/instructor/dashboard/page.tsx',
        description: 'Dashboard del panel de instructor',
        props: [],
        commonErrors: ['Estadísticas no cargan', 'Cursos no aparecen']
      }
    ];
