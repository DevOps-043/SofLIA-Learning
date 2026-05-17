'use client';

import { useTranslation } from 'react-i18next';

import { useSofLIAPersonalization } from '@/core/hooks/useSofLIAPersonalization';
import { PersonalizationSettingsModal } from './personalization-settings/PersonalizationSettingsModal';

interface SofLIAPersonalizationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SofLIAPersonalizationSettings({
  isOpen,
  onClose,
}: SofLIAPersonalizationSettingsProps) {
  const controller = useSofLIAPersonalization();
  const { t } = useTranslation('common');

  return (
    <PersonalizationSettingsModal
      controller={controller}
      isOpen={isOpen}
      onClose={onClose}
      title={t('liaPersonalization.title')}
    />
  );
}
