import type { ChangeEventHandler, DragEventHandler, RefObject } from 'react';
import { Upload, X } from 'lucide-react';

interface DirectVideoUploadProps {
  selectedFile: File | null;
  videoProviderId: string;
  videoPreview: string | null;
  videoDuration: string;
  uploading: boolean;
  uploadProgress: number;
  disabled: boolean;
  dragActive: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  onFileInputChange: ChangeEventHandler<HTMLInputElement>;
  onRemoveVideo: () => void;
  onOpenFileDialog: () => void;
  onDragEnter: DragEventHandler<HTMLDivElement>;
  onDragLeave: DragEventHandler<HTMLDivElement>;
  onDragOver: DragEventHandler<HTMLDivElement>;
  onDrop: DragEventHandler<HTMLDivElement>;
}

export function DirectVideoUpload({
  selectedFile,
  videoProviderId,
  videoPreview,
  videoDuration,
  uploading,
  uploadProgress,
  disabled,
  dragActive,
  fileInputRef,
  videoRef,
  onFileInputChange,
  onRemoveVideo,
  onOpenFileDialog,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}: DirectVideoUploadProps) {
  const hasPreview = Boolean(videoPreview);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subir Video</label>

      {hasPreview ? (
        <div className="relative group">
          <div className="relative bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700">
            <video ref={videoRef} src={videoPreview ?? undefined} className="w-full h-64 object-contain bg-black" controls />

            <button
              type="button"
              onClick={onRemoveVideo}
              className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors z-10"
              title="Eliminar video"
            >
              <X className="w-4 h-4" />
            </button>

            {(selectedFile || videoProviderId) && (
              <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg p-2 text-white text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate mr-2">{selectedFile ? selectedFile.name : 'Video guardado'}</span>
                  {videoDuration && <span className="flex-shrink-0">{videoDuration}</span>}
                </div>
                {selectedFile && (
                  <div className="mt-1 text-gray-300">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</div>
                )}
              </div>
            )}
          </div>

          {uploading && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Subiendo video... {uploadProgress}%</p>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/avi"
            onChange={onFileInputChange}
            disabled={disabled || uploading}
            className="hidden"
          />

          {!uploading && (
            <button
              type="button"
              onClick={onOpenFileDialog}
              disabled={disabled}
              className="mt-2 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm font-medium"
            >
              Cambiar Video
            </button>
          )}
        </div>
      ) : (
        <div
          className={[
            'relative border-2 border-dashed rounded-xl p-8 transition-colors',
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
            disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          ].join(' ')}
          onDragEnter={(event) => {
            if (!disabled && !uploading) {
              onDragEnter(event);
            }
          }}
          onDragLeave={(event) => {
            if (!disabled && !uploading) {
              onDragLeave(event);
            }
          }}
          onDragOver={(event) => {
            if (!disabled && !uploading) {
              onDragOver(event);
            }
          }}
          onDrop={(event) => {
            if (!disabled && !uploading) {
              onDrop(event);
            }
          }}
          onClick={() => {
            if (!disabled && !uploading) {
              onOpenFileDialog();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/avi"
            onChange={onFileInputChange}
            disabled={disabled || uploading}
            className="hidden"
          />

          <div className="text-center">
            <Upload
              className={`w-12 h-12 mx-auto mb-3 ${
                dragActive ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'
              }`}
            />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {dragActive ? 'Suelta el video aquí' : 'Arrastra un video aquí o haz clic para seleccionar'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">MP4, WebM, OGG, MOV, AVI (máximo 1GB)</p>
          </div>
        </div>
      )}
    </div>
  );
}
