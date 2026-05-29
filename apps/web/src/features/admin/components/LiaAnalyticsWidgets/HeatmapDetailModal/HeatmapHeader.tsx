import { DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import type { HourDetailData } from './types';

interface HeatmapHeaderProps {
  data: HourDetailData | null;
  onClose: () => void;
}

export function HeatmapHeader({ data, onClose }: HeatmapHeaderProps) {
  const { t } = useTranslation('admin');

  return (
    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <DialogTitle className="text-xl font-bold text-white">
            {t('liaAnalyticsPage.heatmapModal.title', { day: data?.slot.dayName, hour: data?.slot.hourFormatted })}
          </DialogTitle>
          <p className="mt-1 text-sm text-emerald-100">{t('liaAnalyticsPage.heatmapModal.subtitle')}</p>
        </div>
        <button
          className="rounded-lg bg-white/20 p-2 transition-colors hover:bg-white/30"
          onClick={onClose}
          type="button"
        >
          <XMarkIcon className="h-5 w-5 text-white" />
        </button>
      </div>
    </div>
  );
}
