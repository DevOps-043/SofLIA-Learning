import { VoiceGuideStep } from '../../../core/components/ContextualVoiceGuide';
import { useTranslation } from 'react-i18next';

/**
 * Hook para obtener los steps del tour traducidos
 */
export function useCourseLearnTourSteps(): VoiceGuideStep[] {
  const { t } = useTranslation('learn');

  return [
    {
      id: 1,
      title: t('tour.steps.welcome.title'),
      description: t('tour.steps.welcome.description'),
      speech: t('tour.steps.welcome.speech')
    },
    {
      id: 2,
      title: t('tour.steps.navigation.title'),
      description: t('tour.steps.navigation.description'),
      speech: t('tour.steps.navigation.speech')
    },
    {
      id: 3,
      title: t('tour.steps.materials.title'),
      description: t('tour.steps.materials.description'),
      speech: t('tour.steps.materials.speech')
    },
    {
      id: 4,
      title: t('tour.steps.activities.title'),
      description: t('tour.steps.activities.description'),
      speech: t('tour.steps.activities.speech')
    },
    {
      id: 5,
      title: t('tour.steps.lia.title'),
      description: t('tour.steps.lia.description'),
      speech: t('tour.steps.lia.speech')
    },
    {
      id: 6,
      title: t('tour.steps.progress.title'),
      description: t('tour.steps.progress.description'),
      speech: t('tour.steps.progress.speech')
    },
    {
      id: 7,
      title: t('tour.steps.ready.title'),
      description: t('tour.steps.ready.description'),
      speech: t('tour.steps.ready.speech')
    }
  ];
}

// Exportar steps por defecto en español para compatibilidad (deprecated)
export const COURSE_LEARN_TOUR_STEPS: VoiceGuideStep[] = [
  {
    id: 1,
    title: '¡Bienvenido a tu curso!',
    description: 'Este es tu espacio de aprendizaje interactivo. Aquí encontrarás lecciones, actividades prácticas y recursos para dominar el tema.',
    speech: 'Bienvenido a tu curso. Este es tu espacio de aprendizaje interactivo. Aquí encontrarás lecciones, actividades prácticas y recursos para dominar el tema.'
  },
  {
    id: 2,
    title: 'Navegación del curso',
    description: 'En el panel izquierdo verás todos los módulos y lecciones del curso. Haz clic en cualquier lección para acceder a su contenido.',
    speech: 'En el panel izquierdo verás todos los módulos y lecciones del curso. Haz clic en cualquier lección para acceder a su contenido.'
  },
  {
    id: 3,
    title: 'Materiales de la lección',
    description: 'Cada lección puede incluir videos, textos, PDFs descargables y recursos adicionales. Explora todo el contenido disponible.',
    speech: 'Cada lección puede incluir videos, textos, PDFs descargables y recursos adicionales. Explora todo el contenido disponible.'
  },
  {
    id: 4,
    title: 'Actividades prácticas',
    description: 'Completa las actividades para poner en práctica lo aprendido. Son fundamentales para tu progreso y certificación.',
    speech: 'Completa las actividades para poner en práctica lo aprendido. Son fundamentales para tu progreso y certificación.'
  },
  {
    id: 5,
    title: 'SofLIA está aquí para ayudarte',
    description: 'Si tienes dudas sobre el contenido, las actividades o cualquier tema del curso, pregúntale a SofLIA. Te ayudará en todo momento.',
    speech: 'Si tienes dudas sobre el contenido, las actividades o cualquier tema del curso, pregúntale a SofLIA. Te ayudará en todo momento.'
  },
  {
    id: 6,
    title: 'Seguimiento de progreso',
    description: 'Tu progreso se guarda automáticamente. Puedes ver cuánto has avanzado en el curso y qué lecciones has completado.',
    speech: 'Tu progreso se guarda automáticamente. Puedes ver cuánto has avanzado en el curso y qué lecciones has completado.'
  },
  {
    id: 7,
    title: '¡Listo para aprender!',
    description: 'Ahora estás preparado para comenzar tu viaje de aprendizaje. Recuerda, SofLIA siempre estará disponible para ayudarte.',
    speech: 'Ahora estás preparado para comenzar tu viaje de aprendizaje. Recuerda, SofLIA siempre estará disponible para ayudarte.'
  }
];
