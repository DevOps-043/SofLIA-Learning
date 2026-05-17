import { Play } from 'lucide-react';

export function VideoErrorState(props: {
  error: string;
  videoProvider: string;
  videoProviderId: string;
}) {
  return (
    <div className="flex items-center justify-center h-64 bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30">
      <div className="text-center">
        <div className="text-red-500 mb-2">!</div>
        <p className="text-[#0A2540] dark:text-white mb-2">{props.error}</p>
        <p className="text-sm text-[#6C757D] dark:text-white/60">
          Proveedor: {props.videoProvider} | ID: {props.videoProviderId}
        </p>
      </div>
    </div>
  );
}

export function InvalidVideoState(props: {
  videoProvider?: string;
  videoProviderId?: string;
}) {
  return (
    <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="text-yellow-500 mb-2">!</div>
        <p className="text-gray-600 mb-2">Datos de video invalidos</p>
        <p className="text-sm text-gray-500">
          Proveedor: {props.videoProvider || 'No especificado'} | ID:{' '}
          {props.videoProviderId || 'No especificado'}
        </p>
      </div>
    </div>
  );
}

export function VideoUnavailableState() {
  return (
    <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="text-gray-400 mb-2">Video</div>
        <p className="text-gray-600">Video no disponible</p>
      </div>
    </div>
  );
}

export function EmbedFacade(props: {
  onActivate: () => void;
  tapToPlayLabel: string;
  thumbnailAlt: string;
  thumbnailUrl: string | null;
}) {
  return (
    <button
      type="button"
      className="relative flex h-full min-h-64 w-full items-center justify-center overflow-hidden rounded-lg bg-gray-900 text-white"
      onClick={props.onActivate}
    >
      {props.thumbnailUrl ? (
        <img
          src={props.thumbnailUrl}
          alt={props.thumbnailAlt}
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gray-800" />
      )}
      <span className="relative z-10 flex flex-col items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <Play className="h-7 w-7 fill-white text-white" />
        </span>
        <span className="text-sm font-medium">{props.tapToPlayLabel}</span>
      </span>
    </button>
  );
}
