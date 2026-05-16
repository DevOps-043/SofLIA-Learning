'use client'

import { motion } from 'framer-motion'
import { BuildingOffice2Icon, SparklesIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import type { CreateTab } from './types'

const navItems = [
  { id: 'general' as CreateTab, label: 'General', icon: BuildingOffice2Icon, description: 'Info basica y contacto' },
  { id: 'branding' as CreateTab, label: 'Branding', icon: SparklesIcon, description: 'Logo, colores y marca' },
  { id: 'owner' as CreateTab, label: 'Propietario', icon: UserCircleIcon, description: 'Invitar al dueno' },
]

export function AdminCreateCompanySidebarNav(props: { activeTab: CreateTab; accentColor: string; onTabChange: (tab: CreateTab) => void }) {
  return (
    <nav className="relative z-10 flex-1 space-y-2">
      {navItems.map((item) => {
        const isActive = props.activeTab === item.id
        return (
          <button key={item.id} onClick={() => props.onTabChange(item.id)} className={`group relative w-full overflow-hidden rounded-xl p-3.5 text-left transition-all ${isActive ? 'shadow-lg' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}>
            {isActive ? <motion.div layoutId="activeCreateTabBg" className="absolute inset-0 bg-gray-200/50 ring-1 ring-gray-300 dark:bg-white/10 dark:ring-white/10" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} /> : null}
            <div className="relative z-10 flex items-center gap-3"><item.icon className={`h-5 w-5 transition-colors ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`} style={{ color: isActive ? props.accentColor : undefined }} /><div className="min-w-0 flex-1"><p className={`text-sm font-medium ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'}`}>{item.label}</p><p className={`text-[10px] ${isActive ? 'text-gray-500 dark:text-white/70' : 'text-gray-500'}`}>{item.description}</p></div></div>
          </button>
        )
      })}
    </nav>
  )
}
