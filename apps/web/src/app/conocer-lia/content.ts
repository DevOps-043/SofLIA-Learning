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
    color: 'var(--color-accent)',
    gradient: 'from-accent to-accent/80',
  },
  {
    icon: Brain,
    title: 'Cerebro Extendido',
    description:
      'SofLIA amplía tu capacidad de memoria, razonamiento y acceso a conocimiento. El núcleo de IA procesa datos; SofLIA es la voz que explica y orienta.',
    color: 'var(--color-success)',
    gradient: 'from-success to-success/80',
  },
  {
    icon: Navigation,
    title: 'Copiloto de Aprendizaje',
    description:
      'Nadie recorre la ruta de desarrollo solo. SofLIA es tu copiloto visible que te ayuda a decidir el próximo paso y te propone rutas personalizadas.',
    color: 'var(--color-warning)',
    gradient: 'from-warning to-warning/80',
  },
  {
    icon: Network,
    title: 'Sistema Nervioso del Talento',
    description:
      'SofLIA conecta señales dispersas (datos, capacidades, necesidades) y las transforma en acción coordinada. Detecta patrones y te interpreta las señales.',
    color: 'var(--color-primary)',
    gradient: 'from-primary to-primary/80',
  },
  {
    icon: Layers,
    title: 'Infraestructura de Conocimiento',
    description:
      'SofLIA es la puerta de acceso a la infraestructura donde se almacena, organiza y actualiza el conocimiento crítico. Orquesta y ensambla tu aprendizaje.',
    color: 'var(--color-accent)',
    gradient: 'from-accent to-accent/80',
  },
];

export const liaCapabilities: LiaHighlightCard[] = [
  {
    icon: MessageSquare,
    title: 'PRL-1.0 Mini',
    description:
      'Modelo conversacional con contexto de página. Resuelve dudas, explica conceptos y te guía en tu aprendizaje de forma personalizada.',
    color: 'var(--color-accent)',
    examples: ['Contexto inteligente de página', 'Resuelve dudas al instante', 'Explica conceptos complejos'],
  },
  {
    icon: BookOpen,
    title: 'Resúmenes y Explicaciones',
    description:
      '¿Necesitas un resumen para recordar lo que acabas de aprender? SofLIA resume y explica fragmentos de tus clases favoritas.',
    color: 'var(--color-success)',
    examples: ['Resúmenes de clases', 'Explicaciones paso a paso', 'Síntesis de conceptos'],
  },
  {
    icon: CheckCircle2,
    title: 'Corrección de Ejercicios',
    description:
      'Revisa tus ejercicios con SofLIA. Resuelve tus dudas y pide ayuda para entender las partes con las que tienes dificultades.',
    color: 'var(--color-warning)',
    examples: ['Revisa tu código', 'Corrige ejercicios', 'Explica errores'],
  },
  {
    icon: Target,
    title: 'Respuestas Personalizadas',
    description:
      'Estudia con SofLIA de tu propia manera, de forma personalizada. Pregunta lo que consideres necesario y profundiza en el conocimiento.',
    color: 'var(--color-primary)',
    examples: ['Adaptado a tu nivel', 'Respuestas contextualizadas', 'Aprendizaje personalizado'],
  },
];

export const liaPersonalityFeatures: LiaHighlightCard[] = [
  {
    icon: Sparkles,
    title: 'Tono Cálido pero Profesional',
    description:
      'SofLIA habla de "nosotros" (equipo) más que de "yo máquina". Siempre justifica sus recomendaciones y adapta la complejidad según tu perfil.',
    color: 'var(--color-accent)',
  },
  {
    icon: Users,
    title: 'Anticipa y Sugiere',
    description:
      'SofLIA no impone ni regaña. Anticipa tus necesidades, sugiere próximos pasos y explica el porqué de cada recomendación.',
    color: 'var(--color-success)',
  },
  {
    icon: Clock,
    title: 'Disponible 24/7',
    description:
      'SofLIA está siempre disponible para ayudarte. Estudia las 24 horas, los 7 días de la semana, cuando y donde quieras.',
    color: 'var(--color-warning)',
  },
  {
    icon: TrendingUp,
    title: 'Transparencia Total',
    description:
      'SofLIA es transparente sobre lo que sabe, lo que infiere y lo que aún necesita que definas. Sin límites ocultos.',
    color: 'var(--color-primary)',
  },
];
