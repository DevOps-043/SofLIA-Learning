'use client'

import { motion } from 'framer-motion'
import {
  BuildingOffice2Icon,
  CheckCircleIcon,
  GlobeAltIcon,
  PauseCircleIcon,
  PlusIcon,
  SparklesIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { SOFLIA_ADMIN_COLORS } from '../../constants/admin-color-tokens'
import type { CreateCompanyData, CreateTab, PlanOption } from './types'

const navItems = [
  {
    id: 'general' as CreateTab,
    label: 'General',
    icon: BuildingOffice2Icon,
    description: 'Info básica y contacto',
  },
  {
    id: 'branding' as CreateTab,
    label: 'Branding',
    icon: SparklesIcon,
    description: 'Logo, colores y marca',
  },
  {
    id: 'owner' as CreateTab,
    label: 'Propietario',
    icon: UserCircleIcon,
    description: 'Invitar al dueño',
  },
]

interface AdminCreateCompanySidebarProps {
  activeTab: CreateTab
  formData: CreateCompanyData
  selectedPlan: PlanOption
  primaryColor: string
  accentColor: string
  onTabChange: (tab: CreateTab) => void
}

export function AdminCreateCompanySidebar({
  activeTab,
  formData,
  selectedPlan,
  primaryColor,
  accentColor,
  onTabChange,
}: AdminCreateCompanySidebarProps) {
  return (
    <div
      className="hidden lg:flex w-[320px] flex-col p-8 border-r border-gray-200 dark:border-white/5 relative shrink-0"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}10)`,
      }}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-gray-200/50 dark:bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="relative z-10 text-center mb-8">
        <motion.div
          className="relative inline-block mb-4"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl border-2 border-gray-200 dark:border-white/10 mx-auto bg-gray-100 dark:bg-white/5 backdrop-blur-sm"
            style={{
              background: formData.brand_logo_url
                ? '#fff'
                : `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
            }}
          >
            {formData.brand_logo_url ? (
              <img
                src={formData.brand_logo_url}
                alt="Logo"
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <PlusIcon className="w-10 h-10 text-white" />
            )}
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 p-1.5 rounded-full shadow-lg border border-bgSecondary"
            style={{
              backgroundColor: formData.is_active
                ? SOFLIA_ADMIN_COLORS.success
                : SOFLIA_ADMIN_COLORS.warning,
            }}
          >
            {formData.is_active ? (
              <CheckCircleIcon className="w-3.5 h-3.5 text-white" />
            ) : (
              <PauseCircleIcon className="w-3.5 h-3.5 text-white" />
            )}
          </motion.div>
        </motion.div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 truncate px-2">
          {formData.name || 'Nueva Empresa'}
        </h3>
        <div className="flex items-center justify-center gap-2 opacity-70">
          <GlobeAltIcon
            className="w-3 h-3 text-current"
            style={{ color: accentColor }}
          />
          <p className="text-xs font-mono text-gray-600 dark:text-white/80">
            {formData.slug ? `/${formData.slug}` : '/...'}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 relative z-10">
        {navItems.map((item) => {
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-left relative overflow-hidden group ${
                isActive ? 'shadow-lg' : 'hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeCreateTabBg"
                  className="absolute inset-0 bg-gray-200/50 dark:bg-white/10 ring-1 ring-gray-300 dark:ring-white/10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <item.icon
                className={`w-5 h-5 relative z-10 transition-colors ${
                  isActive
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'
                }`}
                style={{ color: isActive ? accentColor : undefined }}
              />
              <div className="flex-1 min-w-0 relative z-10">
                <p
                  className={`text-sm font-medium ${
                    isActive
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                  }`}
                >
                  {item.label}
                </p>
                <p
                  className={`text-[10px] ${
                    isActive ? 'text-gray-500 dark:text-white/70' : 'text-gray-500'
                  }`}
                >
                  {item.description}
                </p>
              </div>
            </button>
          )
        })}
      </nav>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/5 relative z-10">
        <div className="bg-gray-100 dark:bg-white/5 rounded-xl p-3 border border-gray-200 dark:border-white/5">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">
              Plan Seleccionado
            </p>
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: selectedPlan.color }}
            />
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">
            {selectedPlan.label}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formData.max_users} usuarios máx.
          </p>
        </div>
      </div>
    </div>
  )
}
