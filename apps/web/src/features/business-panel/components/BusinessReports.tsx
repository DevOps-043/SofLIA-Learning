'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Activity,
  Award,
  Filter,
  FileSpreadsheet,
  Download,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  Eye,
  X,
  Sparkles,
  Brain
} from 'lucide-react'
import Image from 'next/image'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useThemeStore } from '../../../core/stores/themeStore'
import { PremiumSelect } from './PremiumSelect'
import { ReportTable } from './ReportTable'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import type { ColumnDef } from '@tanstack/react-table'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from 'react-i18next'
import { useBusinessReportsLogic } from '../hooks/useBusinessReportsLogic'
import { ReportContent } from './reports/ReportContent'
import type { ReportData } from './reports/types'

export function BusinessReports() {
  const {
    isDark,
    cardBg,
    cardBorder,
    textColor,
    accentColor,
    primaryColor,
    secondaryColor,
    REPORT_TYPES,
    reportType,
    filters,
    setFilters,
    reportData,
    isLoading,
    error,
    resetFilters,
    showFilters,
    setShowFilters,
    localStartDate,
    setLocalStartDate,
    localEndDate,
    setLocalEndDate,
    handleReportTypeChange,
    handleGenerateReport,
    handleExportExcel,
  } = useBusinessReportsLogic()

  const { t } = useTranslation('business')

  return (
    <div className="w-full space-y-6" style={{ color: textColor }}>
      {/* Header Premium */}
      {/* Header Premium - Redesigned */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 shadow-xl"
        style={{ 
          backgroundColor: '#0A2540',
        }}
      >
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/teams-header.png"
            alt="Reports Header"
            fill
            className="object-cover"
            style={{ opacity: 0.5 }}
            priority
          />
        </div>
        
        {/* Blue Gradient Overlay - Crucial for the 'Blue' look while keeping image visible */}
        <div 
            className="absolute inset-0 bg-gradient-to-r from-[#0A2540]/90 via-[#0A2540]/50 to-transparent z-0 pointer-events-none"
        />

        {/* Decorative Particles/Grid - Subtle */}
        <div 
          className="absolute inset-0 opacity-10 z-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}
        />

        {/* Content Layer */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
              <BarChart3 className="w-5 h-5" style={{ color: '#FFFFFF' }} />
            </div>
            <span 
              className="text-sm font-bold tracking-widest uppercase drop-shadow-sm"
              style={{ color: 'rgba(219, 234, 254, 0.9)' }}
            >
              {t('reports.subtitle')}
            </span>
          </div>
          
          <h1 
            className="text-3xl md:text-4xl font-bold mb-3 tracking-tight drop-shadow-md"
            style={{ color: '#FFFFFF' }}
          >
            {t('reports.title')}
          </h1>
          
          <p 
            className="text-base max-w-2xl leading-relaxed drop-shadow-sm"
            style={{ color: '#EFF6FF' }}
          >
            {t('reports.description')}
          </p>
        </div>
      </motion.div>

      {/* Selector de Tipo de Reporte */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {REPORT_TYPES.map((type, index) => {
          const Icon = type.icon
          const isSelected = reportType === type.value
          return (
            <motion.button
              key={type.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleReportTypeChange(type.value)}
              disabled={isLoading}
              className={`relative group p-6 rounded-2xl border-2 text-left transition-all overflow-hidden
                ${isSelected 
                  ? '' 
                  : 'bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30'}
              `}
              style={{
                ...(isSelected ? { backgroundColor: `${type.color}15`, borderColor: type.color } : {})
              }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSelected && (
                <motion.div
                  layoutId="activeReport"
                  className="absolute inset-0 rounded-2xl"
                  style={{ backgroundColor: `${type.color}10` }}
                />
              )}
              <div className="relative z-10">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${type.color}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color: type.color }} />
                </div>
                <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white">{type.label}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{type.description}</p>
              </div>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4 w-3 h-3 rounded-full"
                  style={{ backgroundColor: type.color }}
                />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Barra de Acciones */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all hover:opacity-80
              ${showFilters 
                ? '' 
                : 'bg-transparent border-gray-200 dark:border-slate-700/30 text-gray-700 dark:text-gray-300'}
            `}
            style={showFilters ? {
              backgroundColor: `${accentColor}20`,
              borderColor: accentColor,
              color: accentColor
            } : {}}
          >
            <Filter className="w-4 h-4" />
            {t('reports.actions.filters')}
            {showFilters && <X className="w-4 h-4" />}
          </button>
          <button
            onClick={handleGenerateReport}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50 bg-transparent border-gray-200 dark:border-slate-700/30 text-gray-700 dark:text-gray-300"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? t('reports.actions.generating') : t('reports.actions.update')}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {reportData && (
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 hover:scale-105 active:scale-95 text-white"
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.4)'
              }}
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              {t('reports.actions.exportExcel')}
            </button>
          )}
        </div>
      </motion.div>

      {/* Panel de Filtros */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="p-6 rounded-2xl border space-y-4 bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30"
            >
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: accentColor }} />
                {t('reports.filters.title')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 opacity-70">{t('reports.filters.startDate')}</label>
                  <input
                    type="date"
                    value={localStartDate}
                    onChange={(e) => setLocalStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                    style={{ 
                      borderColor: cardBorder,
                      backgroundColor: `${cardBg}CC`,
                      color: textColor
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 opacity-70">{t('reports.filters.endDate')}</label>
                  <input
                    type="date"
                    value={localEndDate}
                    onChange={(e) => setLocalEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                    style={{ 
                      borderColor: cardBorder,
                      backgroundColor: `${cardBg}CC`,
                      color: textColor
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 opacity-70">{t('reports.filters.role')}</label>
                  <PremiumSelect
                    value={filters.role || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, role: value })}
                    placeholder={t('reports.filters.selectRole')}
                    options={[
                      { value: 'all', label: t('reports.status.all') },
                      { value: 'owner', label: t('reports.status.owner') },
                      { value: 'admin', label: t('reports.status.admin') },
                      { value: 'member', label: t('reports.status.member') }
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 opacity-70">{t('reports.filters.status')}</label>
                  <PremiumSelect
                    value={filters.status || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                    placeholder={t('reports.filters.selectStatus')}
                    options={[
                      { value: 'all', label: t('reports.status.all') },
                      { value: 'active', label: t('reports.status.active') },
                      { value: 'invited', label: t('reports.status.invited') },
                      { value: 'suspended', label: t('reports.status.suspended') }
                    ]}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleGenerateReport}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90 text-white disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)` }}
                >
                  {t('reports.actions.applyFilters')}
                </button>
                <button
                  onClick={() => { resetFilters(); setLocalStartDate(''); setLocalEndDate('') }}
                  className="px-4 py-2 rounded-xl border text-sm font-medium transition-all hover:opacity-80"
                  style={{ borderColor: cardBorder, color: textColor }}
                >
                  {t('reports.actions.clear')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Estado de Carga */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-12 rounded-2xl border text-center bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30"
        >
          <div className="inline-flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: primaryColor, borderTopColor: 'transparent' }} />
            <span className="text-gray-500 dark:text-gray-400">{t('reports.messages.loading')}</span>
          </div>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-2xl border bg-red-500/10 border-red-500/30"
        >
          <p className="text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Contenido del Reporte */}
      {reportData && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <ReportContent reportType={reportType} data={reportData.data as ReportData} />
        </motion.div>
      )}
    </div>
  )
}
