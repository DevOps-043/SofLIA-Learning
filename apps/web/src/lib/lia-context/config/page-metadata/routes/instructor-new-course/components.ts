import type { ComponentInfo } from '../../types';

export const instructorNewCourseComponents: ComponentInfo[] = [
      {
        name: 'NewCoursePage',
        path: 'apps/web/src/app/instructor/courses/new/page.tsx',
        description: 'Wizard de creación de curso',
        props: [],
        commonErrors: ['Datos no guardan', 'Video no sube', 'Paso no avanza']
      },
      {
        name: 'CourseWizard',
        path: 'apps/web/src/features/instructor/components/CourseWizard.tsx',
        description: 'Componente wizard multi-paso',
        props: ['onComplete'],
        commonErrors: ['Validación falla', 'Navegación entre pasos falla']
      }
    ];
