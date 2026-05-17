import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import type { TFunction } from 'i18next';

interface LandingFAQHeaderProps {
  isInView: boolean;
  t: TFunction<'common'>;
}

export function LandingFAQHeader({ isInView, t }: LandingFAQHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="lg:sticky lg:top-32 lg:self-start"
    >
      <motion.span
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6 inline-block rounded-full bg-warning/10 px-4 py-2 text-sm font-medium text-warning"
      >
        {t('landing.faq.tag', 'Preguntas Frecuentes')}
      </motion.span>

      <h2 className="mb-6 text-3xl font-bold leading-tight text-primary dark:text-white lg:text-5xl">
        {t('landing.faq.title', 'Respuestas a las preguntas que importan')}
      </h2>

      <p className="mb-8 text-lg text-gray-600 dark:text-white/60">
        {t('landing.faq.subtitle', 'Todo lo que necesitas saber para tomar una decision informada.')}
      </p>

      <div className="hidden items-center gap-4 rounded-md border border-gray-200 bg-gray-100/50 p-6 dark:border-white/10 dark:bg-white/5 lg:flex">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-accent/10">
          <HelpCircle size={24} className="text-accent" />
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-primary dark:text-white">
            {t('landing.faq.help.title', 'Tienes mas preguntas?')}
          </p>
          <p className="text-sm text-gray-600 dark:text-white/60">
            {t('landing.faq.help.description', 'Agenda una demo y resolvemos todas tus dudas.')}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
