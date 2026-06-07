'use client'

import { useTranslation } from 'react-i18next'
import { useMotionSafe } from '../../../lib/utils/motion'
import { ActionsPanel } from './IntegrationsSection/ActionsPanel'
import { CapabilitiesGrid } from './IntegrationsSection/CapabilitiesGrid'
import { IntegrationsHeader } from './IntegrationsSection/Header'

interface IntegrationsSectionProps {
  className?: string
}

export function IntegrationsSection({ className = '' }: IntegrationsSectionProps) {
  const { t } = useTranslation('common')
  const { disableHeavy } = useMotionSafe()
  const translate = (key: string, defaultValue?: string) =>
    defaultValue === undefined ? t(key) : t(key, defaultValue)

  const localizedConversation = [
    {
      type: 'user' as const,
      message: t('landing.liaSection.preview.chat.user1', 'Hola SofLIA, ¿qué puedo hacer aquí?'),
    },
    {
      type: 'lia' as const,
      message: t(
        'landing.liaSection.preview.chat.lia1',
        'Este es tu Dashboard. Desde aquí puedes ver tus cursos asignados, tu progreso de aprendizaje, certificaciones obtenidas y acceder a las comunidades. ¿En qué te puedo ayudar?'
      ),
    },
    {
      type: 'user' as const,
      message: t('landing.liaSection.preview.chat.user2', '¿Cómo veo mis certificados?'),
    },
    {
      type: 'lia' as const,
      message: t(
        'landing.liaSection.preview.chat.lia2',
        'Puedes ver tus certificados en la sección "Mis Certificados" del menú lateral. Ahí encontrarás todos los certificados que has obtenido al completar cursos. También puedes descargarlos o compartirlos.'
      ),
    },
  ]

  return (
    <section
      id="integrations"
      className={`py-20 lg:py-28 bg-gradient-to-b from-gray-200/30 to-white dark:from-primary/30 dark:to-carbon-900 ${className}`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <IntegrationsHeader t={translate} />
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <CapabilitiesGrid t={translate} />
          <ActionsPanel t={translate} disableHeavy={disableHeavy} chatMessages={localizedConversation} />
        </div>
      </div>
    </section>
  )
}
