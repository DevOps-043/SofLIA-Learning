import type { ComponentInfo } from '../../types';

export const courseDetailComponents: ComponentInfo[] = [
      {
        name: 'CourseDetailPage',
        path: 'apps/web/src/app/courses/[slug]/page.tsx',
        description: 'Página de detalle de un curso',
        props: [],
        commonErrors: ['Curso no encontrado', 'Precio no muestra', 'Botón de compra no funciona']
      },
      {
        name: 'CourseHeader',
        path: 'apps/web/src/features/courses/components/CourseHeader.tsx',
        description: 'Header con información del curso',
        props: ['course'],
        commonErrors: ['Imagen no carga', 'Rating incorrecto']
      },
      {
        name: 'CourseCurriculum',
        path: 'apps/web/src/features/courses/components/CourseCurriculum.tsx',
        description: 'Temario del curso',
        props: ['modules', 'lessons'],
        commonErrors: ['Módulos no cargan']
      }
    ];
