'use client';

import { useTranslation } from 'react-i18next';

import { useLiaPersonalization } from '@/core/hooks/useLiaPersonalization';
import { PersonalizationSettingsModal } from './personalization-settings/PersonalizationSettingsModal';

interface LiaPersonalizationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LiaPersonalizationSettings({
  isOpen,
  onClose,
}: LiaPersonalizationSettingsProps) {
  const controller = useLiaPersonalization();
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
