import { Link as LinkIcon, Video, Youtube } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { VideoProvider } from './types';

interface VideoProviderButtonsProps {
  provider: VideoProvider;
  disabled: boolean;
  onProviderChange: (provider: VideoProvider) => void;
}

export function VideoProviderButtons({ provider, disabled, onProviderChange }: VideoProviderButtonsProps) {
  const { t } = useTranslation('admin');

  const providerOptions = [
    { id: 'youtube', label: 'YouTube', icon: Youtube, activeClassName: 'border-red-500 bg-red-50 dark:bg-red-900/20', iconClassName: 'text-red-600 dark:text-red-400' },
    { id: 'vimeo', label: 'Vimeo', icon: Video, activeClassName: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20', iconClassName: 'text-blue-600 dark:text-blue-400' },
    { id: 'direct', label: t('workshops.editor.lessons.videoProviders.direct'), icon: Video, activeClassName: 'border-green-500 bg-green-50 dark:bg-green-900/20', iconClassName: 'text-green-600 dark:text-green-400' },
    { id: 'custom', label: t('workshops.editor.lessons.videoProviders.custom'), icon: LinkIcon, activeClassName: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20', iconClassName: 'text-purple-600 dark:text-purple-400' },
  ] as const;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {t('workshops.editor.lessons.videoProviderLabel')}
      </label>
      <div className="grid grid-cols-2 gap-3">
        {providerOptions.map((option) => {
          const IconComponent = option.icon;
          const isActive = provider === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onProviderChange(option.id as VideoProvider)}
              disabled={disabled}
              className={[
                'flex items-center space-x-2 p-3 rounded-lg border-2 transition-colors',
                isActive ? option.activeClassName : 'border-gray-300 dark:border-gray-600 hover:border-gray-400',
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
            >
              <IconComponent className={`h-5 w-5 ${option.iconClassName}`} />
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
