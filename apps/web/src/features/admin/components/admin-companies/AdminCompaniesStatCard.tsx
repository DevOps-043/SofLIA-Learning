'use client'

import { motion } from 'framer-motion'
import type { ElementType } from 'react'

import {
  adminCompaniesColors,
  type AdminCompaniesThemeColors,
} from '../../services/admin-companies'

interface AdminCompaniesStatCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: ElementType
  color: string
  delay: number
  themeColors: AdminCompaniesThemeColors
}

export function AdminCompaniesStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  delay,
  themeColors,
}: AdminCompaniesStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay * 0.1, duration: 0.5, type: 'spring', stiffness: 100 }}
      whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
      className="relative group overflow-hidden rounded-2xl border p-6"
      style={{
        backgroundColor: themeColors.cardBackground,
        borderColor: `${themeColors.borderColor}30`,
      }}
    >
      <motion.div
        className="absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl opacity-0 transition-opacity duration-700 group-hover:opacity-30"
        style={{ backgroundColor: color }}
      />

      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <motion.div
            className="rounded-xl p-3"
            style={{ backgroundColor: `${color}20` }}
            whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
          >
            <Icon className="h-6 w-6" style={{ color }} />
          </motion.div>
        </div>

        <motion.h3
          className="mb-1 text-3xl font-bold"
          style={{ color: themeColors.textPrimary }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay * 0.1 + 0.2 }}
        >
          {value}
        </motion.h3>

        <p className="mb-1 font-medium" style={{ color: adminCompaniesColors.grayMedium }}>
          {title}
        </p>
        <p className="text-xs" style={{ color: `${adminCompaniesColors.grayMedium}80` }}>
          {subtitle}
        </p>

        <motion.div
          className="absolute bottom-0 left-0 h-1"
          style={{ background: `linear-gradient(to right, ${color}, ${adminCompaniesColors.primary})` }}
          initial={{ width: 0 }}
          animate={{ width: '30%' }}
          transition={{ delay: delay * 0.1 + 0.4, duration: 0.8 }}
        />
      </div>
    </motion.div>
  )
}
