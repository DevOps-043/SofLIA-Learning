import { Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Section } from './Section';
import type { PersonalizationFormData } from './types';

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
      icon={Settings}
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
        className="w-full px-4 py-3 rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#0F1419] text-[#0A2540] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-[#00D4B3] resize-none"
      />
      <p className="text-xs text-[#6C757D] dark:text-gray-400 mt-2">
        {(props.formData.custom_instructions?.length || 0)} / 2000{' '}
        {t('liaPersonalization.characters')}
      </p>
    </Section>
  );
}
