import { User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Section } from './Section';
import type { PersonalizationFormData } from './types';

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
      icon={User}
      isExpanded={props.isExpanded}
      onToggle={props.onToggle}
    >
      <label className="block text-sm font-medium mb-2 text-primary dark:text-white">
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
        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-500/30 bg-white dark:bg-carbon-900 text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
      />
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        {t('liaPersonalization.nicknameHint')}
      </p>
    </Section>
  );
}
