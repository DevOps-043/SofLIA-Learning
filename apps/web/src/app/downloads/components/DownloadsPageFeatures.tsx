'use client'

import { motion } from 'framer-motion'
import { Cpu } from 'lucide-react'
import { DOWNLOADS_FEATURES } from '../constants'

export function DownloadsPageFeatures() {
  return (
    <section className="mb-20">
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00D4B3]/10 border border-[#00D4B3]/20 mb-6">
            <Cpu className="w-4 h-4 text-[#00D4B3]" />
            <span className="text-sm font-medium text-[#00D4B3]">
              Aplicacion de Escritorio
            </span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-[#0A2540] dark:text-white mb-4">
            Que es SofLIA Hub?
          </h2>
          <p className="text-lg text-[#0A2540]/60 dark:text-white/60 max-w-4xl mx-auto leading-relaxed">
            SofLIA Hub es tu asistente personal definitivo y el conector central
            con todo nuestro ecosistema. Mucho mas que una aplicacion, te
            permite integrar SofLIA Learning, ProjectHub y el Area de
            Productividad directamente en tu sistema operativo. Conectate con
            WhatsApp, Google y Microsoft, realiza busquedas e interactua con los
            archivos de tu computadora, y comparte carpetas, proyectos, prompts
            y chats con todo tu equipo, todo desde un solo lugar.
          </p>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DOWNLOADS_FEATURES.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-[#00D4B3]/30 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-[#00D4B3]/10 flex items-center justify-center text-[#00D4B3] mb-4">
              <feature.icon size={24} />
            </div>
            <h4 className="text-lg font-bold dark:text-white mb-2">
              {feature.title}
            </h4>
            <p className="text-sm text-[#0A2540]/60 dark:text-white/60 leading-relaxed">
              {feature.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
