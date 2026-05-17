import type { ComponentInfo } from '../../types';

export const courseLearnComponents: ComponentInfo[] = [
      {
        name: 'CourseLearnPage',
        path: 'apps/web/src/app/courses/[slug]/learn/page.tsx',
        description: 'Página principal del reproductor de lecciones',
        props: [],
        commonErrors: [
          'Página no carga: Curso no encontrado o sin acceso',
          'Video no reproduce: Error del provider de video'
        ]
      },
      {
        name: 'VideoPlayer',
        path: 'apps/web/src/features/courses/components/VideoPlayer.tsx',
        description: 'Reproductor de video de lecciones',
        props: ['videoUrl', 'onProgress', 'onComplete'],
        commonErrors: [
          'Video no carga: URL inválida o proveedor no disponible',
          'Progreso no se guarda: Error en callback onProgress'
        ]
      },
      {
        name: 'LessonNavigation',
        path: 'apps/web/src/features/courses/components/LessonNavigation.tsx',
        description: 'Panel lateral de navegación entre lecciones',
        props: ['lessons', 'currentLessonId', 'onSelect'],
        commonErrors: [
          'Lecciones no cargan: Error en estructura del curso',
          'Click no funciona: Handler no configurado'
        ]
      },
      {
        name: 'EmbeddedSofLIAPanel',
        path: 'apps/web/src/core/components/EmbeddedLiaPanel/EmbeddedLiaPanel.tsx',
        description: 'Panel de SofLIA integrado para ayuda contextual',
        props: ['lessonContext', 'transcript'],
        commonErrors: [
          'SofLIA no responde: Error en API de chat',
          'Contexto incorrecto: Transcripción no disponible'
        ]
      },
      {
        name: 'ActivityPanel',
        path: 'apps/web/src/features/courses/components/ActivityPanel.tsx',
        description: 'Panel de actividades interactivas',
        props: ['activity', 'onComplete'],
        commonErrors: [
          'Actividad no carga: Datos de actividad inválidos',
          'No se puede completar: Error al guardar respuesta'
        ]
      }
    ];
