import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { liaActions } from './data'

type Translate = (key: string, defaultValue?: string) => string

export function ActionsList({ t }: { t: Translate }) {
  return (
    <div className="space-y-3 mb-8">
      {liaActions.map((action, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + index * 0.05 }}
          className="flex items-start gap-3"
        >
          <CheckCircle2 size={20} className="text-[#00D4B3] flex-shrink-0 mt-0.5" />
          <span className="text-[#0A2540] dark:text-white/90">
            {t(`landing.liaSection.actions.${index}`, action)}
          </span>
        </motion.div>
      ))}
    </div>
  )
}
