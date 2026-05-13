import { useTranslation } from 'react-i18next';
import type { VideoProvider } from './types';

interface VideoExternalInputProps {
  provider: Exclude<VideoProvider, 'direct'>;
  value: string;
  disabled: boolean;
  detectingDuration: boolean;
  onChange: (value: string) => void;
}

export function VideoExternalInput({
  provider,
  value,
  disabled,
  detectingDuration,
  onChange,
}: VideoExternalInputProps) {
  const { t } = useTranslation('admin');

  const providerCopy: Record<Exclude<VideoProvider, 'direct'>, { label: string; placeholder: string }> = {
    youtube: {
      label: t('workshops.editor.lessons.videoProviders.youtubeLabel'),
      placeholder: t('workshops.editor.lessons.videoProviders.youtubePlaceholder'),
    },
    vimeo: {
      label: t('workshops.editor.lessons.videoProviders.vimeoLabel'),
      placeholder: t('workshops.editor.lessons.videoProviders.vimeoPlaceholder'),
    },
    custom: {
      label: t('workshops.editor.lessons.videoProviders.customLabel'),
      placeholder: t('workshops.editor.lessons.videoProviders.customPlaceholder'),
    },
  };

  const copy = providerCopy[provider];
  const inputType = provider === 'custom' ? 'url' : 'text';

  return (
    <>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{copy.label}</label>
      <input
        type={inputType}
        value={value}
        onChange={(event) => void onChange(event.target.value)}
        placeholder={copy.placeholder}
        disabled={disabled}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
      />
      {detectingDuration && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {t('workshops.editor.lessons.videoProviders.detectingDuration')}
        </p>
      )}
    </>
  );
}
