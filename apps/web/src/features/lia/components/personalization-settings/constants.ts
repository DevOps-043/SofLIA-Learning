import type { TFunction } from 'i18next';

import type { PersonalizationBaseStyle, PersonalizationFormData } from './types';

export const defaultPersonalizationFormData: PersonalizationFormData = {
  base_style: 'professional',
  custom_instructions: null,
  dictation_enabled: false,
  is_enthusiastic: true,
  is_friendly: true,
  nickname: null,
  voice_enabled: true,
};

export const defaultExpandedSections = {
  about: false,
  advanced: false,
  characteristics: true,
  instructions: false,
  style: true,
};

export function getBaseStyles(t: TFunction<'common'>) {
  const styles: PersonalizationBaseStyle[] = [
    'professional',
    'casual',
    'technical',
    'friendly',
    'formal',
  ];

  return styles.map((value) => ({
    description: t(`liaPersonalization.styles.${value}.description`),
    label: t(`liaPersonalization.styles.${value}.label`),
    value,
  }));
}
