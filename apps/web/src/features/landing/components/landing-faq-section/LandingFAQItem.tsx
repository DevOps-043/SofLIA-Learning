import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LandingFAQItemProps {
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  questionKey: string;
}

export function LandingFAQItem({
  index,
  isOpen,
  onToggle,
  questionKey,
}: LandingFAQItemProps) {
  const { t } = useTranslation('common');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="border-b border-gray-200 last:border-0 dark:border-white/10"
    >
      <button
        onClick={onToggle}
        className="group flex w-full items-center justify-between gap-4 py-6 text-left"
      >
        <span className="text-base font-medium text-primary transition-colors group-hover:text-accent dark:text-white lg:text-lg">
          {t(`landing.faq.items.${questionKey}.question`, questionKey)}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10"
        >
          <ChevronDown
            size={18}
            className={`transition-colors ${isOpen ? 'text-accent' : 'text-gray-600'}`}
          />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-6 leading-relaxed text-gray-600 dark:text-white/60">
              {t(`landing.faq.items.${questionKey}.answer`, '')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
