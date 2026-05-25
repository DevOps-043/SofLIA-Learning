import { Loader2 } from 'lucide-react';

export function EmbedVideoFrame(props: {
  iframeAllow: string;
  isLoading: boolean;
  onError: () => void;
  onLoad: () => void;
  title: string;
  videoUrl: string;
}) {
  return (
    <div className="relative w-full h-full">
      {props.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-carbon-900 dark:bg-carbon-900 rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      )}

      <iframe
        src={props.videoUrl}
        title={props.title}
        className="w-full h-full rounded-lg"
        allow={props.iframeAllow}
        allowFullScreen
        loading="lazy"
        onLoad={props.onLoad}
        onError={props.onError}
        style={{ display: props.isLoading ? 'none' : 'block' }}
      />
    </div>
  );
}
