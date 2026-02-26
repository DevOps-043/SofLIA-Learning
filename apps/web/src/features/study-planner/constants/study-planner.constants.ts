export interface StudyPlannerStep {
  id: number;
  title: string;
  description: string;
  speech: string;
}

export const STUDY_PLANNER_STEPS: StudyPlannerStep[] = [
  {
    id: 1,
    title: '¡Bienvenido al Planificador de Estudios!',
    description: 'Soy LIA, tu asistente inteligente. Estoy aquí para ayudarte a crear un plan de estudios personalizado que se adapte a tu tiempo y ritmo de aprendizaje.',
    speech: '¡Bienvenido al Planificador de Estudios! Soy LIA, tu asistente inteligente. Estoy aquí para ayudarte a crear un plan de estudios personalizado que se adapte a tu tiempo y ritmo de aprendizaje.'
  },
  {
    id: 2,
    title: '¿Cómo funciona?',
    description: 'Puedo crear tu plan de estudios de dos formas: de manera automática usando inteligencia artificial para optimizar tu tiempo, o manualmente donde tú decides cada detalle. ¿Cuál prefieres?',
    speech: 'Puedo crear tu plan de estudios de dos formas: de manera automática usando inteligencia artificial para optimizar tu tiempo, o manualmente donde tú decides cada detalle. ¿Cuál prefieres?'
  },
  {
    id: 3,
    title: 'Planificación Inteligente',
    description: 'Si eliges la opción automática, analizaré tus cursos, tu disponibilidad de tiempo, tu rol profesional y tus preferencias para crear el plan perfecto para ti.',
    speech: 'Si eliges la opción automática, analizaré tus cursos, tu disponibilidad de tiempo, tu rol profesional y tus preferencias para crear el plan perfecto para ti.'
  },
  {
    id: 4,
    title: '¡Empecemos!',
    description: 'Estoy lista para ayudarte. Puedes hablarme por voz haciendo clic en el micrófono, o simplemente continuar para comenzar a configurar tu plan.',
    speech: 'Estoy lista para ayudarte. Puedes hablarme por voz haciendo clic en el micrófono, o simplemente continuar para comenzar a configurar tu plan.'
  }
];
