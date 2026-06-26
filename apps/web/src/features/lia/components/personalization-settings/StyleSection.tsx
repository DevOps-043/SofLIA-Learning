import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getBaseStyles } from './constants';
import { PersonalizationSelect } from './PersonalizationSelect';
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
      <PersonalizationSelect
        value={props.formData.base_style}
        onChange={(val) =>
          props.setFormData({
            ...props.formData,
            base_style: val as PersonalizationBaseStyle,
          })
        }
        options={baseStyles}
      />
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        {baseStyles.find((style) => style.value === props.formData.base_style)?.description}
      </p>
    </Section>
  );
}
