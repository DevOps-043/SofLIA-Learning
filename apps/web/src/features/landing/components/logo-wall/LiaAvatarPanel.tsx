import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

export function LiaAvatarPanel() {
  const { t } = useTranslation('common');

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative flex justify-center lg:justify-end"
    >
      <div className="absolute inset-0 flex items-center justify-center lg:justify-end">
        <div className="h-72 w-72 rounded-full bg-gradient-to-r from-accent/20 to-success/20 blur-3xl lg:h-96 lg:w-96" />
      </div>

      <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }} className="relative">
        <div className="absolute -inset-4 animate-pulse rounded-full bg-gradient-to-r from-accent via-success to-accent opacity-20 blur-sm" />
        <div className="relative h-64 w-64 overflow-hidden rounded-full border-4 border-white/20 shadow-2xl dark:border-white/10 lg:h-80 lg:w-80">
          <Image
            src="/lia-avatar.webp"
            alt="LIA - Asistente de Inteligencia Artificial"
            fill
            className="object-cover object-top"
            priority
          />
        </div>

        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-accent to-success px-4 py-2 shadow-lg"
        >
          <div className="flex items-center gap-2 text-white">
            <Sparkles size={16} />
            <span className="whitespace-nowrap text-sm font-semibold">
              {t('landing.lia.badge', 'Inteligencia Artificial')}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
