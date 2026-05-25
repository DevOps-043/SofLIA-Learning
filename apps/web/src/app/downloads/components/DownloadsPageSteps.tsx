'use client'

import { motion } from 'framer-motion'
import { Monitor, ShieldCheck, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function DownloadsPageSteps() {
  const { t } = useTranslation('common')

  const stepsList = [
    {
      title: t('downloadsPage.steps.download.title'),
      desc: t('downloadsPage.steps.download.desc'),
      icon: Monitor,
    },
    {
      title: t('downloadsPage.steps.install.title'),
      desc: t('downloadsPage.steps.install.desc'),
      icon: Zap,
    },
    {
      title: t('downloadsPage.steps.sync.title'),
      desc: t('downloadsPage.steps.sync.desc'),
      icon: ShieldCheck,
    },
  ]

  return (
    <section className="mb-20">
      <div className="grid md:grid-cols-3 gap-8">
        {stepsList.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="p-8 rounded-3xl bg-accent/5 dark:bg-accent/10 border border-accent/10 dark:border-accent/20"
          >
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-white mb-6">
              <step.icon size={24} />
            </div>
            <h4 className="text-xl font-bold dark:text-white mb-2">
              {step.title}
            </h4>
            <p className="text-sm text-primary/60 dark:text-white/60 leading-relaxed">
              {step.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
