import type { VideoProvider } from './types';

interface VideoExternalInputProps {
  provider: Exclude<VideoProvider, 'direct'>;
  value: string;
  disabled: boolean;
  detectingDuration: boolean;
  onChange: (value: string) => void;
}

const PROVIDER_COPY: Record<Exclude<VideoProvider, 'direct'>, { label: string; placeholder: string }> = {
  youtube: {
    label: 'ID o URL de YouTube',
    placeholder: 'Ej: dQw4w9WgXcQ o https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  vimeo: {
    label: 'ID o URL de Vimeo',
    placeholder: 'Ej: 123456789 o https://vimeo.com/123456789',
  },
  custom: {
    label: 'URL del Video',
    placeholder: 'https://ejemplo.com/video.mp4',
  },
};

export function VideoExternalInput({
  provider,
  value,
  disabled,
  detectingDuration,
  onChange,
}: VideoExternalInputProps) {
  const copy = PROVIDER_COPY[provider];
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
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Detectando duración del video...</p>
      )}
    </>
  );
}
