'use client'

import { motion } from 'framer-motion'
import { BarChart3, Bot, Cpu, Layers, MessageCircle, Search, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function DownloadsPageFeatures() {
  const { t } = useTranslation('common')

  const featuresList = [
    {
      icon: Bot,
      title: t('downloadsPage.features.items.lia.title'),
      desc: t('downloadsPage.features.items.lia.desc'),
    },
    {
      icon: Layers,
      title: t('downloadsPage.features.items.ecosystem.title'),
      desc: t('downloadsPage.features.items.ecosystem.desc'),
    },
    {
      icon: MessageCircle,
      title: t('downloadsPage.features.items.integrations.title'),
      desc: t('downloadsPage.features.items.integrations.desc'),
    },
    {
      icon: Search,
      title: t('downloadsPage.features.items.computerControl.title'),
      desc: t('downloadsPage.features.items.computerControl.desc'),
    },
    {
      icon: BarChart3,
      title: t('downloadsPage.features.items.productivity.title'),
      desc: t('downloadsPage.features.items.productivity.desc'),
    },
    {
      icon: Settings,
      title: t('downloadsPage.features.items.settings.title'),
      desc: t('downloadsPage.features.items.settings.desc'),
    },
  ]

  return (
    <section className="mb-20">
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <Cpu className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">
              {t('downloadsPage.features.badge')}
            </span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-primary dark:text-white mb-4">
            {t('downloadsPage.features.title')}
          </h2>
          <p className="text-lg text-primary/60 dark:text-white/60 max-w-4xl mx-auto leading-relaxed">
            {t('downloadsPage.features.description')}
          </p>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuresList.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-accent/30 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4">
              <feature.icon size={24} />
            </div>
            <h4 className="text-lg font-bold dark:text-white mb-2">
              {feature.title}
            </h4>
            <p className="text-sm text-primary/60 dark:text-white/60 leading-relaxed">
              {feature.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
