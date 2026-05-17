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
      <label className="block text-sm font-medium mb-2 text-[#0A2540] dark:text-white">
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
        className="w-full px-4 py-3 rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#0F1419] text-[#0A2540] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-[#00D4B3]"
      />
      <p className="text-xs text-[#6C757D] dark:text-gray-400 mt-2">
        {t('liaPersonalization.nicknameHint')}
      </p>
    </Section>
  );
}
