import {
  Apple,
  ArrowUpDown,
  BarChart3,
  Bot,
  FileText,
  Github,
  Layers,
  MessageCircle,
  Monitor,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Wrench,
  Zap,
} from 'lucide-react'
import type {
  DownloadsFeature,
  DownloadsRequirement,
  DownloadsStep,
} from './types'

export const RELEASES_API = '/api/releases'

export const DOWNLOADS_REQUIREMENTS: DownloadsRequirement[] = [
  {
    os: 'Windows',
    min: 'Windows 10+ (64-bit)',
    ram: '4 GB (8 GB recomendado)',
    disk: '~300 MB',
    icon: Monitor,
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    os: 'macOS',
    min: 'macOS 12 Monterey+',
    ram: '4 GB (8 GB recomendado)',
    disk: '~300 MB',
    icon: Apple,
    color: 'bg-gray-500/10 text-gray-400',
  },
]

export const DOWNLOADS_STEPS: DownloadsStep[] = [
  {
    title: 'Descarga',
    desc: 'Elige tu plataforma y descarga el instalador oficial.',
    icon: Monitor,
  },
  {
    title: 'Instalacion',
    desc: 'Ejecuta el asistente y sigue los pasos en pantalla.',
    icon: Zap,
  },
  {
    title: 'Sincronizacion',
    desc: 'Inicia sesion y disfruta de SofLIA Hub en tu flujo diario.',
    icon: ShieldCheck,
  },
]

export const DOWNLOADS_FEATURES: DownloadsFeature[] = [
  {
    icon: Bot,
    title: 'Tu Asistente Personal IA',
    desc: 'LIA se convierte en tu asistente personal en el escritorio. Configurala a tu medida para automatizar flujos de trabajo, realizar investigaciones profundas y obtener respuestas instantaneas.',
  },
  {
    icon: Layers,
    title: 'Ecosistema Completo',
    desc: 'Interactua con todo el ecosistema de SofLIA, desde ProjectHub hasta SofLIA Learning. Comparte chats, proyectos, carpetas y prompts directamente con tu equipo.',
  },
  {
    icon: MessageCircle,
    title: 'Integraciones Potentes',
    desc: 'Conexion fluida con Whatsapp, Google Workspace y Microsoft 365, centralizando tus comunicaciones y herramientas de trabajo en un solo lugar.',
  },
  {
    icon: Search,
    title: 'Control sobre tu Computadora',
    desc: 'Busca informacion dentro de tus archivos locales y ejecuta comandos del sistema operativo. SofLIA Hub vive en tu entorno y te ayuda a controlarlo de forma inteligente.',
  },
  {
    icon: BarChart3,
    title: 'Area de Productividad',
    desc: 'Un panel dedicado exclusivamente a maximizar tu rendimiento. Monitorea tu actividad, optimiza tu tiempo de concentracion y gestiona tus tareas diarias.',
  },
  {
    icon: Settings,
    title: 'Configuracion Profunda',
    desc: 'Personaliza todos los aspectos de la interaccion, gestiona integraciones, ajusta permisos locales y decide exactamente como quieres que SofLIA trabaje para ti.',
  },
]

export const DOWNLOADS_CHANGELOG_SECTION_META = {
  added: {
    label: 'Mejoras',
    icon: Plus,
    color: 'text-emerald-500',
    dotColor: 'bg-emerald-500',
  },
  fixed: {
    label: 'Correcciones',
    icon: Wrench,
    color: 'text-blue-500',
    dotColor: 'bg-blue-500',
  },
  changed: {
    label: 'Cambios',
    icon: ArrowUpDown,
    color: 'text-amber-500',
    dotColor: 'bg-amber-500',
  },
  removed: {
    label: 'Eliminados',
    icon: Trash2,
    color: 'text-red-500',
    dotColor: 'bg-red-500',
  },
  security: {
    label: 'Seguridad',
    icon: ShieldCheck,
    color: 'text-purple-500',
    dotColor: 'bg-purple-500',
  },
  notes: {
    label: 'Notas',
    icon: FileText,
    color: 'text-gray-500',
    dotColor: 'bg-gray-500',
  },
  fallback: {
    label: 'Notas',
    icon: FileText,
    color: 'text-gray-500',
    dotColor: 'bg-gray-500',
  },
} as const

export const DOWNLOADS_SAFETY_BADGES = [
  {
    icon: ShieldCheck,
    label: 'Firma Digital SSL',
    accentClassName: 'text-[#00D4B3]',
  },
  {
    icon: ShieldCheck,
    label: 'Actualizaciones Automaticas',
    accentClassName: 'text-[#00D4B3]',
  },
  {
    icon: Github,
    label: 'Codigo Fuente Protegido',
    accentClassName: 'text-white/80',
  },
] as const
