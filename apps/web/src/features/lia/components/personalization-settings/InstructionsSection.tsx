import { ListPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Section } from './Section';
import type { PersonalizationFormData } from './types';
import styles from './PersonalizationSettings.module.css';

interface InstructionsSectionProps {
  formData: PersonalizationFormData;
  isExpanded: boolean;
  onToggle: () => void;
  setFormData: (data: PersonalizationFormData) => void;
}

export function InstructionsSection(props: InstructionsSectionProps) {
  const { t } = useTranslation('common');

  return (
    <Section
      title={t('liaPersonalization.sections.instructions.title')}
      description={t('liaPersonalization.sections.instructions.description')}
      icon={ListPlus}
      isExpanded={props.isExpanded}
      onToggle={props.onToggle}
    >
      <textarea
        value={props.formData.custom_instructions || ''}
        onChange={(event) =>
          props.setFormData({
            ...props.formData,
            custom_instructions: event.target.value || null,
          })
        }
        placeholder={t('liaPersonalization.instructionsPlaceholder')}
        rows={6}
        maxLength={2000}
        className={`${styles.textControl} ${styles.textarea}`}
      />
      <p className={styles.fieldHint}>
        {(props.formData.custom_instructions?.length || 0)} / 2000{' '}
        {t('liaPersonalization.characters')}
      </p>
    </Section>
  );
}
