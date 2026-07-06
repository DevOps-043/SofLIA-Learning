import {
  Apple,
  BarChart3,
  Bot,
  Layers,
  MessageCircle,
  Monitor,
  Search,
  Settings,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react'
import type {
  DownloadsFeature,
  DownloadsRequirement,
  DownloadsStep,
} from './types'

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
  {
    os: 'Linux',
    min: 'Ubuntu 20.04+ / Debian 11+ (64-bit)',
    ram: '4 GB (8 GB recomendado)',
    disk: '~300 MB',
    icon: Terminal,
    color: 'bg-amber-500/10 text-amber-500',
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
