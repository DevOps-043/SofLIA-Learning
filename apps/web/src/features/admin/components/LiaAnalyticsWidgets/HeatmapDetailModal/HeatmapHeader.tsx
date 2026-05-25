import { DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { HourDetailData } from './types';

interface HeatmapHeaderProps {
  data: HourDetailData | null;
  onClose: () => void;
}

export function HeatmapHeader({ data, onClose }: HeatmapHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <DialogTitle className="text-xl font-bold text-white">
            {data?.slot.dayName} a las {data?.slot.hourFormatted}
          </DialogTitle>
          <p className="mt-1 text-sm text-emerald-100">Detalle de actividad de SofLIA</p>
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
