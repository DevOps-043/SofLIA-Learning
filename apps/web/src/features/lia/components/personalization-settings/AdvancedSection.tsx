import { AudioLines } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Section } from './Section';
import { ToggleField } from './ToggleField';
import type { PersonalizationFormData } from './types';
import styles from './PersonalizationSettings.module.css';

interface AdvancedSectionProps {
  formData: PersonalizationFormData;
  isExpanded: boolean;
  onToggle: () => void;
  setFormData: (data: PersonalizationFormData) => void;
}

export function AdvancedSection(props: AdvancedSectionProps) {
  const { t } = useTranslation('common');

  return (
    <Section
      title={t('liaPersonalization.sections.advanced.title')}
      description={t('liaPersonalization.sections.advanced.description')}
      icon={AudioLines}
      isExpanded={props.isExpanded}
      onToggle={props.onToggle}
    >
      <div className={styles.toggleList}>
        <ToggleField
          label={t('liaPersonalization.voiceLabel')}
          description={t('liaPersonalization.voiceDesc')}
          checked={props.formData.voice_enabled ?? true}
          onChange={(checked) =>
            props.setFormData({ ...props.formData, voice_enabled: checked })
          }
        />
        <ToggleField
          label={t('liaPersonalization.dictationLabel')}
          description={t('liaPersonalization.dictationDesc')}
          checked={props.formData.dictation_enabled ?? false}
          onChange={(checked) =>
            props.setFormData({ ...props.formData, dictation_enabled: checked })
          }
        />
      </div>
    </Section>
  );
}
