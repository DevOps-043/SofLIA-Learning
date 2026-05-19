import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getBaseStyles } from './constants';
import { Section } from './Section';
import type { PersonalizationBaseStyle, PersonalizationFormData } from './types';

interface StyleSectionProps {
  formData: PersonalizationFormData;
  isExpanded: boolean;
  onToggle: () => void;
  setFormData: (data: PersonalizationFormData) => void;
}

export function StyleSection(props: StyleSectionProps) {
  const { t } = useTranslation('common');
  const baseStyles = getBaseStyles(t);

  return (
    <Section
      title={t('liaPersonalization.sections.style.title')}
      description={t('liaPersonalization.sections.style.description')}
      icon={Sparkles}
      isExpanded={props.isExpanded}
      onToggle={props.onToggle}
    >
      <label className="block text-sm font-medium mb-2 text-primary dark:text-white">
        {t('liaPersonalization.styleLabel')}
      </label>
      <select
        value={props.formData.base_style}
        onChange={(event) =>
          props.setFormData({
            ...props.formData,
            base_style: event.target.value as PersonalizationBaseStyle,
          })
        }
        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-500/30 bg-white dark:bg-carbon-900 text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
      >
        {baseStyles.map((style) => (
          <option key={style.value} value={style.value}>
            {style.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        {baseStyles.find((style) => style.value === props.formData.base_style)?.description}
      </p>
    </Section>
  );
}
