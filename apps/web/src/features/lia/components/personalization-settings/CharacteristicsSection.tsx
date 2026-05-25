import { MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Section } from './Section';
import { ToggleField } from './ToggleField';
import type { PersonalizationFormData } from './types';

interface CharacteristicsSectionProps {
  formData: PersonalizationFormData;
  isExpanded: boolean;
  onToggle: () => void;
  setFormData: (data: PersonalizationFormData) => void;
}

export function CharacteristicsSection(props: CharacteristicsSectionProps) {
  const { t } = useTranslation('common');

  return (
    <Section
      title={t('liaPersonalization.sections.characteristics.title')}
      description={t('liaPersonalization.sections.characteristics.description')}
      icon={MessageSquare}
      isExpanded={props.isExpanded}
      onToggle={props.onToggle}
    >
      <div className="space-y-4">
        <ToggleField
          label={t('liaPersonalization.friendlyLabel')}
          description={t('liaPersonalization.friendlyDesc')}
          checked={props.formData.is_friendly ?? true}
          onChange={(checked) =>
            props.setFormData({ ...props.formData, is_friendly: checked })
          }
        />
        <ToggleField
          label={t('liaPersonalization.enthusiasticLabel')}
          description={t('liaPersonalization.enthusiasticDesc')}
          checked={props.formData.is_enthusiastic ?? true}
          onChange={(checked) =>
            props.setFormData({ ...props.formData, is_enthusiastic: checked })
          }
        />
      </div>
    </Section>
  );
}
