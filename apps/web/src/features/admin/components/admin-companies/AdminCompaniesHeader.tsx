'use client'

import { motion } from 'framer-motion'
import {
  ArrowPathIcon,
  BuildingOffice2Icon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

import {
  adminCompaniesColors,
  type AdminCompaniesThemeColors,
} from '../../services/admin-companies'

interface AdminCompaniesHeaderProps {
  onRefresh: () => void
  onCreate: () => void
  themeColors: AdminCompaniesThemeColors
}

export function AdminCompaniesHeader({
  onRefresh,
  onCreate,
  themeColors,
}: AdminCompaniesHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <SparklesIcon className="h-5 w-5" style={{ color: adminCompaniesColors.accent }} />
            <span
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: adminCompaniesColors.accent }}
            >
              Gestion B2B
            </span>
          </div>
          <h1 className="text-3xl font-bold lg:text-4xl" style={{ color: themeColors.textPrimary }}>
            Administracion de Empresas
          </h1>
          <p className="mt-2" style={{ color: themeColors.textSecondary }}>
            Gestiona organizaciones, planes y usuarios empresariales
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={onRefresh}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 rounded-xl px-5 py-3 font-medium"
            style={{ backgroundColor: `${adminCompaniesColors.grayMedium}20`, color: 'white' }}
          >
            <ArrowPathIcon className="h-5 w-5" />
            Actualizar
          </motion.button>
          <motion.button
            onClick={onCreate}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 rounded-xl px-5 py-3 font-medium"
            style={{ backgroundColor: adminCompaniesColors.success, color: 'white' }}
          >
            <BuildingOffice2Icon className="h-5 w-5" />
            Nueva Organizacion
          </motion.button>
        </div>
      </div>
    </motion.header>
  )
}
