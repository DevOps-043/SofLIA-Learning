import { motion } from 'framer-motion'
import { ActionsList } from './ActionsList'
import { ChatPreview } from './ChatPreview'

type Translate = (key: string, defaultValue?: string) => string

interface ActionsPanelProps {
  disableHeavy: boolean
  t: Translate
}

export function ActionsPanel({ disableHeavy, t }: ActionsPanelProps) {
  return (
    <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}>
      <h3 className="text-xl font-bold text-[#0A2540] dark:text-white mb-6">
        {t('landing.liaSection.actionsTitle', 'SofLIA puede ayudarte a:')}
      </h3>
      <ActionsList t={t} />
      <ChatPreview disableHeavy={disableHeavy} t={t} />
    </motion.div>
  )
}
