import {
  Brain,
  Calendar,
  Globe,
  HelpCircle,
  Lightbulb,
  MapPin,
  MessageSquare,
  UserCog,
} from 'lucide-react'

export const liaCapabilities = [
  { icon: MessageSquare, titleKey: 'conversation', descKey: 'conversationDesc' },
  { icon: Brain, titleKey: 'context', descKey: 'contextDesc' },
  { icon: Calendar, titleKey: 'studyPlanner', descKey: 'studyPlannerDesc' },
  { icon: UserCog, titleKey: 'rolePersonalization', descKey: 'rolePersonalizationDesc' },
  { icon: MapPin, titleKey: 'anywhere', descKey: 'anywhereDesc' },
  { icon: Globe, titleKey: 'multilingual', descKey: 'multilingualDesc' },
  { icon: Lightbulb, titleKey: 'recommendations', descKey: 'recommendationsDesc' },
  { icon: HelpCircle, titleKey: 'support', descKey: 'supportDesc' },
]

export const liaActions = [
  'Responder dudas sobre cualquier contenido del curso',
  'Explicar conceptos complejos de manera simple',
  'Crear y gestionar tu plan de estudios proactivamente',
  'Detectar sesiones atrasadas y proponer reprogramaciones',
  'Personalizar recomendaciones según tu rol y nivel',
  'Ayudarte en cualquier sección de la plataforma',
  'Guiarte por la plataforma paso a paso',
  'Generar resúmenes de lecciones',
]


