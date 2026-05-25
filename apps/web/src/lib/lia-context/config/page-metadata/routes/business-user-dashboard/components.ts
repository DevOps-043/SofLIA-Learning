import type { ComponentInfo } from '../../types';

export const businessUserDashboardComponents: ComponentInfo[] = [
      {
        name: 'BusinessUserDashboardPage',
        path: 'apps/web/src/app/[orgSlug]/business-user/dashboard/page.tsx',
        description: 'Dashboard principal para usuarios empresariales',
        props: [],
        commonErrors: [
          'Dashboard no carga: Error de autenticación',
          'Cursos no aparecen: Usuario sin cursos asignados'
        ]
      },
      {
        name: 'CourseCard',
        path: 'apps/web/src/features/courses/components/CourseCard.tsx',
        description: 'Tarjeta de curso con progreso',
        props: ['course', 'progress', 'deadline'],
        commonErrors: [
          'Progreso incorrecto: Datos no sincronizados',
          'Deadline no muestra: No hay fecha límite asignada'
        ]
      }
    ];
