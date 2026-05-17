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

export const chatConversation = [
  { type: 'user' as const, message: 'Hola SofLIA, ¿qué puedo hacer aquí?' },
  {
    type: 'lia' as const,
    message:
      'Este es tu Dashboard. Desde aquí puedes ver tus cursos asignados, tu progreso de aprendizaje, certificaciones obtenidas y acceder a las comunidades. ¿En qué te puedo ayudar?',
  },
  { type: 'user' as const, message: '¿Cómo veo mis certificados?' },
  {
    type: 'lia' as const,
    message:
      'Puedes ver tus certificados en la sección "Mis Certificados" del menú lateral. Ahí encontrarás todos los certificados que has obtenido al completar cursos. También puedes descargarlos o compartirlos.',
  },
]
