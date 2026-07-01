'use client'

import { ArrowLeftIcon, ArrowPathIcon, BuildingOffice2Icon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { CompanyData } from '@/features/admin/hooks/useEditCompanyLogic'

interface EditCompanyHeroCardProps {
  company: CompanyData
  error?: string | null
  saving: boolean
  saveSuccess?: boolean
  onBack: () => void
  onSave: () => void
}

export function EditCompanyHeroCard({
  company,
  error,
  saving,
  saveSuccess = false,
  onBack,
  onSave,
}: EditCompanyHeroCardProps) {
  const { t } = useTranslation('admin')

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/5 dark:bg-carbon-800">
      {/* Accent top strip */}
      <div className="h-1 bg-primary dark:bg-accent" />

      <div className="flex items-center justify-between gap-4 px-6 py-5">
        {/* Left: back button + company identity */}
        <div className="flex min-w-0 items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={onBack}
            className="shrink-0 rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </motion.button>

          {/* Logo */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-carbon-900">
            {company.brand_logo_url ? (
              <img
                src={company.brand_logo_url}
                alt={company.name}
                className="h-full w-full rounded-2xl object-contain p-2"
              />
            ) : (
              <BuildingOffice2Icon className="h-7 w-7 text-primary dark:text-accent" />
            )}
          </div>

          {/* Name + metadata */}
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-gray-900 dark:text-white">
              {company.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-xs text-gray-500 dark:text-white/40">
                {t('companies.edit.headerSubtitle')}
              </span>
              {company.subscription_plan && (
                <>
                  <span className="text-gray-300 dark:text-white/15">·</span>
                  <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-white/50">
                    {company.subscription_plan}
                  </span>
                </>
              )}
              <span className="text-gray-300 dark:text-white/15">·</span>
              <span className="text-xs text-gray-500 dark:text-white/40">
                {company.total_users} usuario{company.total_users !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Right: status + save button */}
        <div className="flex shrink-0 items-center gap-3">
          {error ? (
            <p className="max-w-xs truncate text-right text-xs font-medium text-error">{error}</p>
          ) : saveSuccess ? (
            <p className="text-xs font-medium text-success">{t('companies.actions.saved')}</p>
          ) : null}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50 dark:bg-accent dark:text-primary dark:shadow-accent/20 dark:hover:bg-accent/90"
          >
            {saving ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircleIcon className="h-4 w-4" />
            )}
            {saving ? t('companies.actions.saving') : t('companies.actions.saveChanges')}
          </motion.button>
        </div>
      </div>
    </div>
  )
}
