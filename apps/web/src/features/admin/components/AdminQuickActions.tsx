'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  PlusIcon,
  BookOpenIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  NewspaperIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

interface QuickAction {
  id: string
  name: string
  description: string
  href: string
  icon: typeof PlusIcon
  gradient: string
  shadow: string
}

const quickActions: QuickAction[] = [
  {
    id: 'add-user',
    name: 'Agregar Usuario',
    description: 'Crear un nuevo usuario en el sistema',
    href: '/admin/users/create',
    icon: PlusIcon,
    gradient: 'from-blue-500 to-blue-600',
    shadow: 'shadow-blue-500/20'
  },
  {
    id: 'create-workshop',
    name: 'Crear Taller',
    description: 'Añadir un nuevo taller a la plataforma',
    href: '/admin/workshops/create',
    icon: BookOpenIcon,
    gradient: 'from-[#10B981] to-[#059669]',
    shadow: 'shadow-emerald-500/20'
  },
  {
    id: 'create-community',
    name: 'Crear Comunidad',
    description: 'Crear una nueva comunidad',
    href: '/admin/communities/create',
    icon: UserGroupIcon,
    gradient: 'from-purple-500 to-indigo-600',
    shadow: 'shadow-purple-500/20'
  },
  {
    id: 'add-prompt',
    name: 'Agregar Prompt',
    description: 'Añadir un nuevo prompt al directorio',
    href: '/admin/prompts/create',
    icon: ChatBubbleLeftRightIcon,
    gradient: 'from-amber-500 to-orange-600',
    shadow: 'shadow-amber-500/20'
  },
  {
    id: 'add-ai-app',
    name: 'Agregar App de IA',
    description: 'Añadir una nueva aplicación de IA',
    href: '/admin/apps/create',
    icon: CpuChipIcon,
    gradient: 'from-red-500 to-rose-600',
    shadow: 'shadow-red-500/20'
  },
  {
    id: 'create-news',
    name: 'Crear Noticia',
    description: 'Publicar una nueva noticia',
    href: '/admin/news/create',
    icon: NewspaperIcon,
    gradient: 'from-indigo-500 to-blue-700',
    shadow: 'shadow-indigo-500/20'
  }
]

export function AdminQuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {quickActions.map((action, index) => (
        <motion.div
          key={action.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -5 }}
          className="relative group"
        >
          <Link
            href={action.href}
            className="block h-full bg-white dark:bg-[#1E2329] rounded-2xl border border-[#E9ECEF] dark:border-white/5 p-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative"
          >
            {/* Hover Gradient Overlay */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-gradient-to-br ${action.gradient}`} />
            
            <div className="relative z-10 flex items-start gap-4">
              <div className={`shrink-0 p-3 rounded-xl bg-gradient-to-br ${action.gradient} text-white shadow-lg ${action.shadow} group-hover:scale-110 transition-transform duration-300`}>
                <action.icon className="h-6 w-6" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-[#0A2540] dark:text-white group-hover:text-[#00D4B3] transition-colors duration-300">
                  {action.name}
                </h3>
                <p className="mt-1 text-sm text-[#6C757D] dark:text-white/60 line-clamp-2">
                  {action.description}
                </p>
              </div>

              <div className="shrink-0 self-center">
                 <ArrowRightIcon className="h-5 w-5 text-[#6C757D] dark:text-white/40 group-hover:text-[#00D4B3] group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </div>

            {/* Bottom Progress Indicator */}
            <motion.div 
               className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-1/3 bg-gradient-to-r ${action.gradient} transition-all duration-500`}
            />
          </Link>
        </motion.div>
      ))}
    </div>
  )
}

