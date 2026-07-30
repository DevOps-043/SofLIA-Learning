import { UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Section } from './Section';
import type { PersonalizationFormData } from './types';
import styles from './PersonalizationSettings.module.css';

interface AboutSectionProps {
  formData: PersonalizationFormData;
  isExpanded: boolean;
  onToggle: () => void;
  setFormData: (data: PersonalizationFormData) => void;
}

export function AboutSection(props: AboutSectionProps) {
  const { t } = useTranslation('common');

  return (
    <Section
      title={t('liaPersonalization.sections.about.title')}
      description={t('liaPersonalization.sections.about.description')}
      icon={UserRound}
      isExpanded={props.isExpanded}
      onToggle={props.onToggle}
    >
      <label className={styles.fieldLabel}>
        {t('liaPersonalization.nicknameLabel')}
      </label>
      <input
        type="text"
        value={props.formData.nickname || ''}
        onChange={(event) =>
          props.setFormData({ ...props.formData, nickname: event.target.value || null })
        }
        placeholder={t('liaPersonalization.nicknamePlaceholder')}
        maxLength={50}
        className={styles.textControl}
      />
      <p className={styles.fieldHint}>
        {t('liaPersonalization.nicknameHint')}
      </p>
    </Section>
  );
}
