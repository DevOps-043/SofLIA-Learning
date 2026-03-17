'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, ArrowLeft, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCreateCompany } from '../hooks/useCreateCompany'

interface CreateCompanyFormProps {
  userEmail?: string
  onBack: () => void
  onSuccess: () => void
}

export function CreateCompanyForm({ userEmail, onBack, onSuccess }: CreateCompanyFormProps) {
  const { t } = useTranslation('common')
  const { createCompany, isCreating, error } = useCreateCompany()

  const [name, setName] = useState('')
  const [contactEmail, setContactEmail] = useState(userEmail || '')
  const [contactPhone, setContactPhone] = useState('')
  const [description, setDescription] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!name.trim()) {
      setFormError(t('orgOnboarding.errors.nameRequired'))
      return
    }
    if (!contactEmail.trim()) {
      setFormError(t('orgOnboarding.errors.emailRequired'))
      return
    }

    const success = await createCompany({
      name: name.trim(),
      contact_email: contactEmail.trim(),
      contact_phone: contactPhone.trim() || undefined,
      description: description.trim() || undefined,
      website_url: websiteUrl.trim() || undefined,
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
        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('orgOnboarding.back')}
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('orgOnboarding.createCompany')}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {t('orgOnboarding.companyName')} *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-colors shadow-sm dark:shadow-none"
            placeholder="Ej: Mi Empresa S.A."
            disabled={isCreating}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {t('orgOnboarding.contactEmail')} *
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-colors shadow-sm dark:shadow-none"
            placeholder="contacto@empresa.com"
            disabled={isCreating}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {t('orgOnboarding.contactPhone')}
          </label>
          <input
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-colors shadow-sm dark:shadow-none"
            placeholder="+52 55 1234 5678"
            disabled={isCreating}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {t('orgOnboarding.description')}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-colors resize-none shadow-sm dark:shadow-none"
            placeholder="Breve descripción de tu empresa..."
            disabled={isCreating}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {t('orgOnboarding.website')}
          </label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-colors shadow-sm dark:shadow-none"
            placeholder="https://www.miempresa.com"
            disabled={isCreating}
          />
        </div>

        {displayError && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {displayError}
          </div>
        )}

        <button
          type="submit"
          disabled={isCreating}
          className="w-full py-3.5 rounded-xl font-semibold bg-blue-500 hover:bg-blue-400 text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('orgOnboarding.creating')}
            </>
          ) : (
            t('orgOnboarding.submit')
          )}
        </button>
      </form>
    </motion.div>
  )
}
