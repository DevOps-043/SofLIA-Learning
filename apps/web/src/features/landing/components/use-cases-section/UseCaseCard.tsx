import { motion } from 'framer-motion';
import type { TFunction } from 'i18next';
import { ArrowRight } from 'lucide-react';

import type { UseCaseItem } from './use-cases.config';
import { useCaseCardVariants } from './use-cases.motion';

interface UseCaseCardProps {
  disableHeavy: boolean;
  t: TFunction<'common'>;
  useCase: UseCaseItem;
}

interface UseCaseTextBlockProps {
  label: string;
  labelClassName: string;
  strong?: boolean;
  value: string;
}

export function UseCaseCard({ disableHeavy, t, useCase }: UseCaseCardProps) {
  const Icon = useCase.icon;

  return (
    <motion.div
      variants={useCaseCardVariants}
      whileHover={{ y: -8 }}
      className="group relative overflow-hidden rounded-md"
    >
      <div className="absolute inset-0 rounded-md border border-gray-200 bg-white transition-all duration-500 group-hover:border-transparent dark:border-white/10 dark:bg-gray-800" />
      <div
        className={`absolute inset-0 rounded-md bg-gradient-to-br ${useCase.gradientClassName} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
        style={{ padding: '1px' }}
      >
        <div className="h-full w-full rounded-md bg-white dark:bg-gray-800" />
      </div>

      <div className="relative p-8">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ duration: 0.3 }}
          className={`mb-6 flex h-16 w-16 items-center justify-center rounded-md bg-gradient-to-br shadow-lg ${useCase.gradientClassName}`}
        >
          <Icon size={28} className="text-white" />
        </motion.div>

        <h3 className="mb-3 text-xl font-bold text-primary dark:text-white">
          {t(`landing.useCases.items.${useCase.key}.title`, useCase.key)}
        </h3>

        <UseCaseTextBlock
          label={t('landing.useCases.labels.pain', 'Desafio')}
          labelClassName="text-warning"
          value={t(`landing.useCases.items.${useCase.key}.pain`, '')}
        />
        <UseCaseTextBlock
          label={t('landing.useCases.labels.solution', 'Solucion')}
          labelClassName="text-accent"
          value={t(`landing.useCases.items.${useCase.key}.solution`, '')}
        />

        <div className="border-t border-gray-200 pt-4 dark:border-white/10">
          <UseCaseTextBlock
            label={t('landing.useCases.labels.result', 'Resultado')}
            labelClassName="text-success"
            value={t(`landing.useCases.items.${useCase.key}.result`, '')}
            strong
          />
        </div>

        <motion.div
          className={`absolute right-8 top-8 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${useCase.accentClassName}`}
          animate={disableHeavy ? {} : { x: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ArrowRight size={20} />
        </motion.div>
      </div>
    </motion.div>
  );
}

function UseCaseTextBlock({ label, labelClassName, strong = false, value }: UseCaseTextBlockProps) {
  return (
    <div className="mb-4">
      <p className={`mb-1 text-xs font-medium uppercase tracking-wider ${labelClassName}`}>
        {label}
      </p>
      <p
        className={`text-sm dark:text-white/60 ${
          strong ? 'font-medium text-primary dark:text-white' : 'text-gray-600'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
