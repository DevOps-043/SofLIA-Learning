import { motion } from 'framer-motion'
import { liaCapabilities } from './data'

type Translate = (key: string, defaultValue?: string) => string

export function CapabilitiesGrid({ t }: { t: Translate }) {
  return (
    <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
      <h3 className="text-xl font-bold text-[#0A2540] dark:text-white mb-6">
        {t('landing.liaSection.capabilitiesTitle', 'Capacidades de SofLIA')}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {liaCapabilities.map((capability, index) => (
          <motion.div
            key={capability.titleKey}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.03, y: -2 }}
            className="p-5 bg-white dark:bg-white/5 rounded-xl border border-[#E9ECEF] dark:border-white/10 hover:border-[#00D4B3]/30 hover:shadow-lg transition-all duration-300"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00D4B3]/20 to-[#00A896]/20 flex items-center justify-center mb-4">
              <capability.icon size={22} className="text-[#00D4B3]" />
            </div>
            <h4 className="font-semibold text-[#0A2540] dark:text-white mb-2">
              {t(`landing.liaSection.capabilities.${capability.titleKey}`, capability.titleKey)}
            </h4>
            <p className="text-sm text-[#6C757D] dark:text-white/60">
              {t(`landing.liaSection.capabilities.${capability.descKey}`, capability.descKey)}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
