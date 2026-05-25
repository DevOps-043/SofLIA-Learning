import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

type Translate = (key: string, defaultValue?: string) => string

export function IntegrationsHeader({ t }: { t: Translate }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 dark:bg-accent/20 rounded-full mb-6">
        <Sparkles size={16} className="text-accent" />
        <span className="text-sm font-medium text-accent">{t('landing.liaSection.tag', 'Asistente de IA')}</span>
      </div>
      <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-primary dark:text-white mb-6">
        {t('landing.liaSection.title', '¿Qué puede hacer')} <span className="text-accent">SofLIA</span> {t('landing.liaSection.titleEnd', 'por ti?')}
      </h2>
      <p className="text-lg text-gray-500 dark:text-white/70 max-w-3xl mx-auto">
        {t('landing.liaSection.description', 'SofLIA es tu asistente de aprendizaje con inteligencia artificial, disponible 24/7 para ayudarte en cada paso de tu capacitación.')}
      </p>
    </motion.div>
  )
}
