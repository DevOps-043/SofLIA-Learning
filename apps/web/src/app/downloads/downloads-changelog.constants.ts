import {
  ArrowUpDown,
  FileText,
  Plus,
  ShieldCheck,
  Trash2,
  Wrench,
} from 'lucide-react'

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
