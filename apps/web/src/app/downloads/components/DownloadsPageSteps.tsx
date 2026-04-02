'use client'

import { motion } from 'framer-motion'
import { DOWNLOADS_STEPS } from '../constants'

export function DownloadsPageSteps() {
  return (
    <section className="mb-20">
      <div className="grid md:grid-cols-3 gap-8">
        {DOWNLOADS_STEPS.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="p-8 rounded-3xl bg-[#00D4B3]/5 dark:bg-[#00D4B3]/10 border border-[#00D4B3]/10 dark:border-[#00D4B3]/20"
          >
            <div className="w-12 h-12 rounded-xl bg-[#00D4B3] flex items-center justify-center text-white mb-6">
              <step.icon size={24} />
            </div>
            <h4 className="text-xl font-bold dark:text-white mb-2">
              {step.title}
            </h4>
            <p className="text-sm text-[#0A2540]/60 dark:text-white/60 leading-relaxed">
              {step.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
