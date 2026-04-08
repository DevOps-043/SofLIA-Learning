'use client'

import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Calendar,
  Download,
  FileSpreadsheet,
  Filter,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react'
import { PremiumSelect } from './PremiumSelect'
import { useBusinessReportsLogic } from '../hooks/useBusinessReportsLogic'
import { ReportContent } from './reports/ReportContent'
import type { ReportData } from './reports/types'
import { useTranslation } from 'react-i18next'

export function BusinessReports() {
  const {
    panelTheme,
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
    <div className="w-full space-y-6" style={{ color: panelTheme.textColor }}>
      <motion.section
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[32px] border p-8 md:p-10"
        style={{
          background: panelTheme.heroBackground,
          borderColor: panelTheme.heroBorderColor,
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            color: '#FFFFFF',
          }}
        />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-2xl border flex items-center justify-center backdrop-blur-sm"
              style={{
                backgroundColor: panelTheme.inverseSurface,
                borderColor: panelTheme.inverseBorderColor,
              }}
            >
              <FileSpreadsheet className="w-6 h-6" style={{ color: panelTheme.inverseTextColor }} />
            </div>
            <span
              className="text-sm font-bold uppercase tracking-[0.22em]"
              style={{ color: panelTheme.inverseSubtextColor }}
            >
              {t('reports.subtitle')}
            </span>
          </div>

          <h1
            className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
            style={{ color: panelTheme.inverseTextColor }}
          >
            {t('reports.title')}
          </h1>
          <p
            className="text-base md:text-lg leading-relaxed"
            style={{ color: panelTheme.inverseSubtextColor }}
          >
            {t('reports.description')}
          </p>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {REPORT_TYPES.map((type, index) => {
          const Icon = type.icon
          const isSelected = reportType === type.value

          return (
            <motion.button
              key={type.value}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleReportTypeChange(type.value)}
              disabled={isLoading}
              className="text-left rounded-[24px] border p-5 transition-all duration-200"
              style={{
                backgroundColor: isSelected ? panelTheme.actionSurface : panelTheme.cardBg,
                borderColor: isSelected ? `${panelTheme.actionColor}30` : panelTheme.borderColor,
                boxShadow: isSelected
                  ? `0 22px 40px -30px ${panelTheme.actionColor}`
                  : panelTheme.isDark
                    ? '0 18px 34px -30px rgba(0,0,0,0.52)'
                    : '0 18px 34px -30px rgba(15,23,42,0.16)',
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl border flex items-center justify-center mb-4"
                style={{
                  backgroundColor: isSelected ? panelTheme.actionSurface : panelTheme.hoverBg,
                  borderColor: isSelected ? `${panelTheme.actionColor}28` : panelTheme.borderColor,
                }}
              >
                <Icon
                  className="w-6 h-6"
                  style={{ color: isSelected ? panelTheme.actionColor : type.color }}
                />
              </div>

              <h2 className="text-lg font-bold mb-1" style={{ color: panelTheme.textColor }}>
                {type.label}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: panelTheme.subtextColor }}>
                {type.description}
              </p>
            </motion.button>
          )
        })}
      </div>

      <div
        className="rounded-[28px] border p-4 md:p-5 space-y-4"
        style={{
          backgroundColor: panelTheme.cardBg,
          borderColor: panelTheme.borderColor,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <ToolbarButton
              icon={<Filter className="w-4 h-4" />}
              label={t('reports.actions.filters')}
              active={showFilters}
              onClick={() => setShowFilters(!showFilters)}
              panelTheme={panelTheme}
              trailing={showFilters ? <X className="w-4 h-4" /> : null}
            />

            <ToolbarButton
              icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
              label={isLoading ? t('reports.actions.generating') : t('reports.actions.update')}
              active={false}
              onClick={handleGenerateReport}
              panelTheme={panelTheme}
            />
          </div>

          {reportData && (
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5"
              style={{
                backgroundColor: panelTheme.actionColor,
                color: panelTheme.onActionColor,
                border: `1px solid ${panelTheme.actionColor}20`,
              }}
            >
              <Download className="w-4 h-4" />
              {t('reports.actions.exportExcel')}
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div
                className="rounded-[24px] border p-5 space-y-4"
                style={{
                  backgroundColor: panelTheme.hoverBg,
                  borderColor: panelTheme.borderColor,
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-9 h-9 rounded-xl border flex items-center justify-center"
                    style={{
                      backgroundColor: panelTheme.actionSurface,
                      borderColor: `${panelTheme.actionColor}22`,
                    }}
                  >
                    <Calendar className="w-4 h-4" style={{ color: panelTheme.actionColor }} />
                  </div>
                  <h3 className="font-semibold" style={{ color: panelTheme.textColor }}>
                    {t('reports.filters.title')}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <FilterField
                    label={t('reports.filters.startDate')}
                    panelTheme={panelTheme}
                    content={
                      <input
                        type="date"
                        value={localStartDate}
                        onChange={(event) => setLocalStartDate(event.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border focus:outline-none"
                        style={{
                          backgroundColor: panelTheme.cardBg,
                          borderColor: panelTheme.borderColor,
                          color: panelTheme.textColor,
                        }}
                      />
                    }
                  />

                  <FilterField
                    label={t('reports.filters.endDate')}
                    panelTheme={panelTheme}
                    content={
                      <input
                        type="date"
                        value={localEndDate}
                        onChange={(event) => setLocalEndDate(event.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border focus:outline-none"
                        style={{
                          backgroundColor: panelTheme.cardBg,
                          borderColor: panelTheme.borderColor,
                          color: panelTheme.textColor,
                        }}
                      />
                    }
                  />

                  <FilterField
                    label={t('reports.filters.role')}
                    panelTheme={panelTheme}
                    content={
                      <PremiumSelect
                        value={filters.role || 'all'}
                        onValueChange={(value) => setFilters({ ...filters, role: value })}
                        placeholder={t('reports.filters.selectRole')}
                        options={[
                          { value: 'all', label: t('reports.status.all') },
                          { value: 'owner', label: t('reports.status.owner') },
                          { value: 'admin', label: t('reports.status.admin') },
                          { value: 'member', label: t('reports.status.member') },
                        ]}
                      />
                    }
                  />

                  <FilterField
                    label={t('reports.filters.status')}
                    panelTheme={panelTheme}
                    content={
                      <PremiumSelect
                        value={filters.status || 'all'}
                        onValueChange={(value) => setFilters({ ...filters, status: value })}
                        placeholder={t('reports.filters.selectStatus')}
                        options={[
                          { value: 'all', label: t('reports.status.all') },
                          { value: 'active', label: t('reports.status.active') },
                          { value: 'invited', label: t('reports.status.invited') },
                          { value: 'suspended', label: t('reports.status.suspended') },
                        ]}
                      />
                    }
                  />
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleGenerateReport}
                    disabled={isLoading}
                    className="rounded-2xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                    style={{
                      backgroundColor: panelTheme.actionColor,
                      color: panelTheme.onActionColor,
                    }}
                  >
                    {t('reports.actions.applyFilters')}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      resetFilters()
                      setLocalStartDate('')
                      setLocalEndDate('')
                    }}
                    className="rounded-2xl px-4 py-2.5 text-sm font-semibold border"
                    style={{
                      backgroundColor: panelTheme.cardBg,
                      borderColor: panelTheme.borderColor,
                      color: panelTheme.textColor,
                    }}
                  >
                    {t('reports.actions.clear')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isLoading && (
        <div
          className="rounded-[28px] border p-10 text-center"
          style={{
            backgroundColor: panelTheme.cardBg,
            borderColor: panelTheme.borderColor,
          }}
        >
          <div className="inline-flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: panelTheme.actionColor, borderTopColor: 'transparent' }}
            />
            <span style={{ color: panelTheme.subtextColor }}>{t('reports.messages.loading')}</span>
          </div>
        </div>
      )}

      {error && (
        <div
          className="rounded-[28px] border p-5"
          style={{
            backgroundColor: `${panelTheme.dangerColor}10`,
            borderColor: `${panelTheme.dangerColor}28`,
            color: panelTheme.dangerColor,
          }}
        >
          {error}
        </div>
      )}

      {reportData && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div
            className="rounded-[28px] border px-5 py-4 flex flex-wrap items-center gap-3"
            style={{
              backgroundColor: panelTheme.cardBg,
              borderColor: panelTheme.borderColor,
            }}
          >
            <div
              className="w-10 h-10 rounded-2xl border flex items-center justify-center"
              style={{
                backgroundColor: panelTheme.actionSurface,
                borderColor: `${panelTheme.actionColor}20`,
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: panelTheme.actionColor }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: panelTheme.textColor }}>
                {REPORT_TYPES.find((type) => type.value === reportType)?.label}
              </p>
              <p className="text-xs" style={{ color: panelTheme.subtextColor }}>
                {REPORT_TYPES.find((type) => type.value === reportType)?.description}
              </p>
            </div>
          </div>

          <ReportContent reportType={reportType} data={reportData.data as ReportData} />
        </motion.div>
      )}
    </div>
  )
}

function ToolbarButton({
  icon,
  label,
  active,
  onClick,
  panelTheme,
  trailing,
}: {
  icon: ReactNode
  label: string
  active: boolean
  onClick: () => void
  panelTheme: ReturnType<typeof useBusinessReportsLogic>['panelTheme']
  trailing?: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold border transition-colors"
      style={{
        backgroundColor: active ? panelTheme.actionSurface : panelTheme.cardBg,
        borderColor: active ? `${panelTheme.actionColor}24` : panelTheme.borderColor,
        color: active ? panelTheme.actionColor : panelTheme.textColor,
      }}
    >
      {icon}
      <span>{label}</span>
      {trailing}
    </button>
  )
}

function FilterField({
  label,
  content,
  panelTheme,
}: {
  label: string
  content: ReactNode
  panelTheme: ReturnType<typeof useBusinessReportsLogic>['panelTheme']
}) {
  return (
    <div>
      <label
        className="block text-sm font-medium mb-2"
        style={{ color: panelTheme.subtextColor }}
      >
        {label}
      </label>
      {content}
    </div>
  )
}
