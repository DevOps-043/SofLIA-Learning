import { WandSparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getBaseStyles } from './constants';
import { PersonalizationSelect } from './PersonalizationSelect';
import { Section } from './Section';
import type { PersonalizationBaseStyle, PersonalizationFormData } from './types';
import styles from './PersonalizationSettings.module.css';

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
      icon={WandSparkles}
      isExpanded={props.isExpanded}
      onToggle={props.onToggle}
    >
      <label className={styles.fieldLabel}>
        {t('liaPersonalization.styleLabel')}
      </label>
      <PersonalizationSelect
        value={props.formData.base_style ?? ''}
        onChange={(val) =>
          props.setFormData({
            ...props.formData,
            base_style: val as PersonalizationBaseStyle,
          })
        }
        options={baseStyles}
      />
      <p className={styles.fieldHint}>
        {baseStyles.find((style) => style.value === props.formData.base_style)?.description}
      </p>
    </Section>
  );
}
