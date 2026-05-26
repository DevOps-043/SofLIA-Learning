'use client';

import { motion } from 'framer-motion';
import { Building2, CheckCircle, Mail, MessageSquare, Phone, Send, User, Users } from 'lucide-react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useLandingContactForm } from '../../hooks/useLandingContactForm';

type ContactFormTone = 'dark' | 'light';

interface LandingContactFormProps {
  source: string;
  tone?: ContactFormTone;
  extended?: boolean;
}

const inputIconClass = 'absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2';

export function LandingContactForm({
  source,
  tone = 'dark',
  extended = false,
}: LandingContactFormProps) {
  const { t } = useTranslation('common');
  const {
    formData,
    isSubmitting,
    isSubmitted,
    submitError,
    updateField,
    submitContact,
  } = useLandingContactForm();

  const isDark = tone === 'dark';
  const inputClass = isDark
    ? 'w-full rounded-xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-white placeholder-white/30 transition-colors focus:border-accent/50 focus:outline-none'
    : 'w-full rounded-xl border border-gray-200 bg-white py-4 pl-12 pr-4 text-primary placeholder-gray-500 shadow-sm transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-carbon-950 dark:text-white dark:placeholder-white/40';
  const textareaClass = isDark
    ? 'min-h-32 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-white placeholder-white/30 transition-colors focus:border-accent/50 focus:outline-none'
    : 'min-h-32 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-4 text-primary placeholder-gray-500 shadow-sm transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-carbon-950 dark:text-white dark:placeholder-white/40';
  const iconClass = isDark ? 'text-white/30' : 'text-gray-500 dark:text-white/40';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await submitContact({ data: formData, source });
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="py-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.15 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/15"
        >
          <CheckCircle size={40} className="text-success" />
        </motion.div>
        <h3 className={`mb-3 text-2xl font-bold ${isDark ? 'text-white' : 'text-primary dark:text-white'}`}>
          {t('landing.cta.success.title')}
        </h3>
        <p className={isDark ? 'text-white/60' : 'text-gray-600 dark:text-gray-300'}>
          {t('landing.cta.success.description')}
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="relative">
          <User className={`${inputIconClass} ${iconClass}`} />
          <input
            type="text"
            value={formData.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder={t('landing.cta.form.name')}
            required
            minLength={2}
            maxLength={200}
            className={inputClass}
          />
        </div>

        <div className="relative">
          <Mail className={`${inputIconClass} ${iconClass}`} />
          <input
            type="email"
            value={formData.email}
            onChange={(event) => updateField('email', event.target.value)}
            placeholder={t('landing.cta.form.email')}
            required
            maxLength={320}
            className={inputClass}
          />
        </div>
      </div>

      <div className={extended ? 'grid gap-6 md:grid-cols-2' : ''}>
        <div className="relative">
          <Building2 className={`${inputIconClass} ${iconClass}`} />
          <input
            type="text"
            value={formData.company}
            onChange={(event) => updateField('company', event.target.value)}
            placeholder={t('landing.cta.form.company')}
            required
            maxLength={200}
            className={inputClass}
          />
        </div>

        {extended && (
          <div className="relative">
            <Phone className={`${inputIconClass} ${iconClass}`} />
            <input
              type="tel"
              value={formData.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              placeholder={t('landing.contactPage.form.phone')}
              maxLength={80}
              className={inputClass}
            />
          </div>
        )}
      </div>

      {extended && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="relative">
            <Users className={`${inputIconClass} ${iconClass}`} />
            <select
              value={formData.companySize}
              onChange={(event) => updateField('companySize', event.target.value)}
              className={`${inputClass} appearance-none`}
            >
              <option value="">{t('landing.contactPage.form.companySize')}</option>
              <option value="1-50">{t('landing.contactPage.form.companySizeOptions.small')}</option>
              <option value="51-250">{t('landing.contactPage.form.companySizeOptions.medium')}</option>
              <option value="251-1000">{t('landing.contactPage.form.companySizeOptions.large')}</option>
              <option value="1000+">{t('landing.contactPage.form.companySizeOptions.enterprise')}</option>
            </select>
          </div>

          <div className="relative">
            <MessageSquare className={`${inputIconClass} ${iconClass}`} />
            <select
              value={formData.interest}
              onChange={(event) => updateField('interest', event.target.value)}
              className={`${inputClass} appearance-none`}
            >
              <option value="">{t('landing.contactPage.form.interest')}</option>
              <option value="demo">{t('landing.contactPage.form.interestOptions.demo')}</option>
              <option value="assessment">{t('landing.contactPage.form.interestOptions.assessment')}</option>
              <option value="enterprise">{t('landing.contactPage.form.interestOptions.enterprise')}</option>
              <option value="support">{t('landing.contactPage.form.interestOptions.support')}</option>
            </select>
          </div>
        </div>
      )}

      {extended && (
        <textarea
          value={formData.message}
          onChange={(event) => updateField('message', event.target.value)}
          placeholder={t('landing.contactPage.form.message')}
          maxLength={1200}
          className={textareaClass}
        />
      )}

      {submitError && (
        <p className={isDark ? 'text-sm text-red-300' : 'text-sm text-error'}>
          {t(submitError)}
        </p>
      )}

      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-accent to-success px-6 py-4 text-lg font-medium text-white shadow-lg shadow-accent/25 transition-all duration-300 hover:shadow-accent/40 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="h-6 w-6 rounded-full border-2 border-white/30 border-t-white"
          />
        ) : (
          <>
            {t('landing.cta.form.submit')}
            <Send size={20} />
          </>
        )}
      </motion.button>
    </form>
  );
}
