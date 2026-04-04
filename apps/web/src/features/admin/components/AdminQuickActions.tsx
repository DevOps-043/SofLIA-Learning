'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  PlusIcon,
  BookOpenIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  NewspaperIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'

interface QuickAction {
  id: string
  name: string
  description: string
  href: string
  icon: typeof PlusIcon
  color: string
}

const quickActions: QuickAction[] = [
  {
    id: 'add-user',
    name: 'Agregar Usuario',
    description: 'Crear un nuevo usuario en el sistema',
    href: '/admin/users/create',
    icon: PlusIcon,
    color: 'blue'
  },
  {
    id: 'create-workshop',
    name: 'Crear Taller',
    description: 'Añadir un nuevo taller a la plataforma',
    href: '/admin/workshops/create',
    icon: BookOpenIcon,
    color: 'green'
  },
  {
    id: 'create-community',
    name: 'Crear Comunidad',
    description: 'Crear una nueva comunidad',
    href: '/admin/communities/create',
    icon: UserGroupIcon,
    color: 'purple'
  },
  {
    id: 'add-prompt',
    name: 'Agregar Prompt',
    description: 'Añadir un nuevo prompt al directorio',
    href: '/admin/prompts/create',
    icon: ChatBubbleLeftRightIcon,
    color: 'orange'
  },
  {
    id: 'add-ai-app',
    name: 'Agregar App de IA',
    description: 'Añadir una nueva aplicación de IA',
    href: '/admin/apps/create',
    icon: CpuChipIcon,
    color: 'red'
  },
  {
    id: 'create-news',
    name: 'Crear Noticia',
    description: 'Publicar una nueva noticia',
    href: '/admin/news/create',
    icon: NewspaperIcon,
    color: 'indigo'
  }
]

export function AdminQuickActions() {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null)

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400',
        hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        icon: 'text-green-600 dark:text-green-400',
        hover: 'hover:bg-green-100 dark:hover:bg-green-900/30'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        icon: 'text-purple-600 dark:text-purple-400',
        hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/30'
      },
      orange: {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        icon: 'text-orange-600 dark:text-orange-400',
        hover: 'hover:bg-orange-100 dark:hover:bg-orange-900/30'
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        icon: 'text-red-600 dark:text-red-400',
        hover: 'hover:bg-red-100 dark:hover:bg-red-900/30'
      },
      indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        icon: 'text-indigo-600 dark:text-indigo-400',
        hover: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
      }
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.blue
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {quickActions.map((action) => {
        const colors = getColorClasses(action.color)
        const isHovered = hoveredAction === action.id
        
        return (
          <Link
            key={action.id}
            href={action.href}
            className={`
              group relative bg-gray-800 rounded-lg border border-gray-700 p-6 
              transition-all duration-300 hover:shadow-lg hover:scale-105 ${colors.hover}
            `}
            onMouseEnter={() => setHoveredAction(action.id)}
            onMouseLeave={() => setHoveredAction(null)}
          >
            <div className="flex items-start">
              <div className={`flex-shrink-0 p-3 rounded-lg ${colors.bg} transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}>
                <action.icon className={`h-6 w-6 ${colors.icon}`} />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-white group-hover:text-gray-300 transition-colors">
                  {action.name}
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  {action.description}
                </p>
              </div>
              <div className="flex-shrink-0">
                <PlusIcon className={`h-5 w-5 text-gray-400 group-hover:text-gray-300 transition-all duration-300 ${isHovered ? 'rotate-90' : ''}`} />
              </div>
            </div>
            
            {/* Hover effect overlay */}
            <div className={`
              absolute inset-0 rounded-lg bg-gradient-to-r from-transparent to-white/5 dark:to-gray-700/5 
              opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none
            `} />
          </Link>
        )
      })}
    </div>
  )
}
