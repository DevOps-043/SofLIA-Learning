'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { UserPlus, ArrowLeft, Loader2, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useJoinCompany } from '../hooks/useJoinCompany'

interface JoinCompanyFormProps {
  onBack: () => void
  onSuccess: () => void
}

export function JoinCompanyForm({ onBack, onSuccess }: JoinCompanyFormProps) {
  const { t } = useTranslation('common')
  const { submitJoinRequest, isSubmitting, error } = useJoinCompany()

  const [slug, setSlug] = useState('')
  const [message, setMessage] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!slug.trim()) {
      setFormError(t('orgOnboarding.errors.codeRequired'))
      return
    }

    const success = await submitJoinRequest({
      slug: slug.trim().toLowerCase(),
      message: message.trim() || undefined,
      job_title: jobTitle.trim() || undefined,
    })

    if (success) {
      onSuccess()
    }
  }

  const displayError = formError || error

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-lg mx-auto"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('orgOnboarding.back')}
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center">
          <UserPlus className="w-6 h-6 text-teal-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">{t('orgOnboarding.joinCompany')}</h2>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-teal-500/5 border border-teal-500/10 text-teal-400 text-sm mb-6">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>{t('orgOnboarding.companyCodeHint')}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            {t('orgOnboarding.companyCode')} *
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-colors"
            placeholder="ej: mi-empresa"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            {t('orgOnboarding.jobTitle')}
          </label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-colors"
            placeholder="Ej: Gerente de Ventas"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            {t('orgOnboarding.message')}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-colors resize-none"
            placeholder="Mensaje opcional para el administrador..."
            disabled={isSubmitting}
          />
        </div>

        {displayError && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {displayError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-xl font-semibold bg-teal-500 hover:bg-teal-400 text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('orgOnboarding.joining')}
            </>
          ) : (
            t('orgOnboarding.submit')
          )}
        </button>
      </form>
    </motion.div>
  )
}
