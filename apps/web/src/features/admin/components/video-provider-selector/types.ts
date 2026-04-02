export type VideoProvider = 'youtube' | 'vimeo' | 'direct' | 'custom';

export interface VideoProviderSelectorProps {
  provider: VideoProvider;
  videoProviderId: string;
  onProviderChange: (provider: VideoProvider) => void;
  onVideoIdChange: (id: string) => void;
  onDurationChange?: (durationSeconds: number) => void;
  onUploadComplete?: (url: string) => void;
  disabled?: boolean;
}
