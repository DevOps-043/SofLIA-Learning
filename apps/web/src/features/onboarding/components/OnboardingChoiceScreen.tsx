'use client'

import { motion } from 'framer-motion'
import { Building2, UserPlus, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface OnboardingChoiceScreenProps {
  onCreateCompany: () => void
  onJoinCompany: () => void
}

export function OnboardingChoiceScreen({ onCreateCompany, onJoinCompany }: OnboardingChoiceScreenProps) {
  const { t } = useTranslation('common')

  const options = [
    {
      id: 'create',
      icon: Building2,
      title: t('orgOnboarding.createCompany'),
      description: t('orgOnboarding.createCompanyDesc'),
      onClick: onCreateCompany,
      gradient: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      borderHover: 'hover:border-blue-500/40',
    },
    {
      id: 'join',
      icon: UserPlus,
      title: t('orgOnboarding.joinCompany'),
      description: t('orgOnboarding.joinCompanyDesc'),
      onClick: onJoinCompany,
      gradient: 'from-teal-500 to-emerald-600',
      iconBg: 'bg-teal-500/10',
      iconColor: 'text-teal-400',
      borderHover: 'hover:border-teal-500/40',
    },
  ]

  return (
    <div className="text-center">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4"
      >
        {t('orgOnboarding.title')}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-lg text-gray-400 mb-12 max-w-xl mx-auto"
      >
        {t('orgOnboarding.subtitle')}
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {options.map((option, index) => (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            onClick={option.onClick}
            className={`
              group relative rounded-2xl border border-white/10 bg-gray-800/50
              p-8 text-left transition-all duration-300
              hover:bg-gray-800 hover:scale-[1.02] hover:shadow-xl
              ${option.borderHover}
            `}
          >
            <div className={`w-14 h-14 rounded-xl ${option.iconBg} flex items-center justify-center mb-6`}>
              <option.icon className={`w-7 h-7 ${option.iconColor}`} />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">{option.title}</h3>
            <p className="text-gray-400 text-sm mb-6">{option.description}</p>

            <div className={`
              inline-flex items-center gap-2 text-sm font-medium
              bg-gradient-to-r ${option.gradient} bg-clip-text text-transparent
            `}>
              <span>Comenzar</span>
              <ArrowRight className={`w-4 h-4 ${option.iconColor} transition-transform group-hover:translate-x-1`} />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
