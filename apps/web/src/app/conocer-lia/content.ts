import type { LucideIcon } from 'lucide-react';
import {
  Brain,
  MessageSquare,
  Navigation,
  Layers,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Target,
  Users,
  Clock,
  TrendingUp,
  Calendar,
  Cpu,
  Network,
} from 'lucide-react';

export interface LiaHighlightCard {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  gradient?: string;
  examples?: string[];
  features?: string[];
}

export const liaMetaphors: LiaHighlightCard[] = [
  {
    icon: Cpu,
    title: 'Sistema Operativo de Aprendizaje',
    description:
      'SofLIA es la capa que organiza, coordina y conecta todas las aplicaciones de formación, contenidos y experiencias. SofLIA piensa, SofLIA te acompaña.',
    color: '#00D4B3',
    gradient: 'from-[#00D4B3] to-[#00D4B3]/80',
  },
  {
    icon: Brain,
    title: 'Cerebro Extendido',
    description:
      'SofLIA amplía tu capacidad de memoria, razonamiento y acceso a conocimiento. El núcleo de IA procesa datos; SofLIA es la voz que explica y orienta.',
    color: '#10B981',
    gradient: 'from-[#10B981] to-[#10B981]/80',
  },
  {
    icon: Navigation,
    title: 'Copiloto de Aprendizaje',
    description:
      'Nadie recorre la ruta de desarrollo solo. SofLIA es tu copiloto visible que te ayuda a decidir el próximo paso y te propone rutas personalizadas.',
    color: '#F59E0B',
    gradient: 'from-[#F59E0B] to-[#F59E0B]/80',
  },
  {
    icon: Network,
    title: 'Sistema Nervioso del Talento',
    description:
      'SofLIA conecta señales dispersas (datos, capacidades, necesidades) y las transforma en acción coordinada. Detecta patrones y te interpreta las señales.',
    color: '#0A2540',
    gradient: 'from-[#0A2540] to-[#0A2540]/80',
  },
  {
    icon: Layers,
    title: 'Infraestructura de Conocimiento',
    description:
      'SofLIA es la puerta de acceso a la infraestructura donde se almacena, organiza y actualiza el conocimiento crítico. Orquesta y ensambla tu aprendizaje.',
    color: '#00D4B3',
    gradient: 'from-[#00D4B3] to-[#00D4B3]/80',
  },
];

export const liaCapabilities: LiaHighlightCard[] = [
  {
    icon: MessageSquare,
    title: 'PRL-1.0 Mini',
    description:
      'Modelo conversacional con contexto de página. Resuelve dudas, explica conceptos y te guía en tu aprendizaje de forma personalizada.',
    color: '#00D4B3',
    examples: ['Contexto inteligente de página', 'Resuelve dudas al instante', 'Explica conceptos complejos'],
  },
  {
    icon: BookOpen,
    title: 'Resúmenes y Explicaciones',
    description:
      '¿Necesitas un resumen para recordar lo que acabas de aprender? SofLIA resume y explica fragmentos de tus clases favoritas.',
    color: '#10B981',
    examples: ['Resúmenes de clases', 'Explicaciones paso a paso', 'Síntesis de conceptos'],
  },
  {
    icon: CheckCircle2,
    title: 'Corrección de Ejercicios',
    description:
      'Revisa tus ejercicios con SofLIA. Resuelve tus dudas y pide ayuda para entender las partes con las que tienes dificultades.',
    color: '#F59E0B',
    examples: ['Revisa tu código', 'Corrige ejercicios', 'Explica errores'],
  },
  {
    icon: Target,
    title: 'Respuestas Personalizadas',
    description:
      'Estudia con SofLIA de tu propia manera, de forma personalizada. Pregunta lo que consideres necesario y profundiza en el conocimiento.',
    color: '#0A2540',
    examples: ['Adaptado a tu nivel', 'Respuestas contextualizadas', 'Aprendizaje personalizado'],
  },
];

export const liaStudyPlannerFeatures: LiaHighlightCard[] = [
  {
    icon: Target,
    title: 'Generación Automática con IA',
    description:
      'LIA crea tu plan de estudios considerando tu rol profesional, perfil completo, cursos adquiridos y progreso actual. Todo adaptado a tu disponibilidad y preferencias.',
    color: '#00D4B3',
    features: [
      'Análisis de tu perfil profesional',
      'Cálculo de disponibilidad granular',
      'Distribución inteligente de lecciones',
      'Ajuste según tu progreso',
    ],
  },
  {
    icon: Clock,
    title: 'Gestión Inteligente de Tiempo',
    description:
      'LIA calcula tiempos mínimos por lección, considera duración de videos, actividades y materiales. Valida que tu plan sea realista y alcanzable.',
    color: '#10B981',
    features: [
      'Cálculo preciso de tiempos',
      'Validación de tiempos mínimos',
      'Sesiones cortas, medianas o largas',
      'Optimización de tu tiempo',
    ],
  },
  {
    icon: Navigation,
    title: 'Rutas Personalizadas',
    description:
      'LIA propone rutas de aprendizaje basadas en tu nivel, área profesional y objetivos. Te sugiere el siguiente paso más adecuado para ti.',
    color: '#F59E0B',
    features: [
      'Rutas adaptadas a tu nivel',
      'Secuencias optimizadas',
      'Recomendaciones contextuales',
      'Progresión natural',
    ],
  },
  {
    icon: TrendingUp,
    title: 'Seguimiento de Progreso',
    description:
      'LIA monitorea tu avance, detecta patrones de estudio y ajusta tu plan dinámicamente. Te ayuda a mantener rachas y cumplir objetivos.',
    color: '#0A2540',
    features: ['Monitoreo continuo', 'Ajustes automáticos', 'Sistema de rachas', 'Métricas de progreso'],
  },
  {
    icon: Calendar,
    title: 'Integración con Calendarios',
    description:
      'LIA sincroniza tu plan de estudios con tus calendarios externos. Respeta tus compromisos y encuentra los mejores momentos para estudiar.',
    color: '#00D4B3',
    features: [
      'Sincronización automática',
      'Detección de conflictos',
      'Reagendamiento inteligente',
      'Recordatorios personalizados',
    ],
  },
  {
    icon: Brain,
    title: 'Mejores Prácticas de Estudio',
    description:
      'LIA aplica técnicas comprobadas como repetición espaciada, práctica distribuida y recall activo para maximizar tu retención y aprendizaje.',
    color: '#10B981',
    features: ['Repetición espaciada', 'Práctica distribuida', 'Técnica Pomodoro', 'Recall activo'],
  },
];

export const liaPersonalityFeatures: LiaHighlightCard[] = [
  {
    icon: Sparkles,
    title: 'Tono Cálido pero Profesional',
    description:
      'SofLIA habla de "nosotros" (equipo) más que de "yo máquina". Siempre justifica sus recomendaciones y adapta la complejidad según tu perfil.',
    color: '#00D4B3',
  },
  {
    icon: Users,
    title: 'Anticipa y Sugiere',
    description:
      'SofLIA no impone ni regaña. Anticipa tus necesidades, sugiere próximos pasos y explica el porqué de cada recomendación.',
    color: '#10B981',
  },
  {
    icon: Clock,
    title: 'Disponible 24/7',
    description:
      'SofLIA está siempre disponible para ayudarte. Estudia las 24 horas, los 7 días de la semana, cuando y donde quieras.',
    color: '#F59E0B',
  },
  {
    icon: TrendingUp,
    title: 'Transparencia Total',
    description:
      'SofLIA es transparente sobre lo que sabe, lo que infiere y lo que aún necesita que definas. Sin límites ocultos.',
    color: '#0A2540',
  },
];
