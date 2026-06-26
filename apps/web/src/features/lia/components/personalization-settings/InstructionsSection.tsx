import type React from 'react';
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
        style={{ '--ifr': 'var(--org-accent-color, var(--color-accent))' } as React.CSSProperties}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-500/30 bg-white dark:bg-carbon-900 text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ifr)] focus:border-[var(--ifr)] resize-none"
      />
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        {(props.formData.custom_instructions?.length || 0)} / 2000{' '}
        {t('liaPersonalization.characters')}
      </p>
    </Section>
  );
}
