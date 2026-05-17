import {
  Github,
  ShieldCheck,
} from 'lucide-react'

export const DOWNLOADS_SAFETY_BADGES = [
  {
    icon: ShieldCheck,
    label: 'Firma Digital SSL',
    accentClassName: 'text-accent',
  },
  {
    icon: ShieldCheck,
    label: 'Actualizaciones Automaticas',
    accentClassName: 'text-accent',
  },
  {
    icon: Github,
    label: 'Codigo Fuente Protegido',
    accentClassName: 'text-white/80',
  },
] as const
