'use client';

import {
  DirectVideoUpload,
  VideoExternalInput,
  VideoProviderButtons,
  useVideoProviderSelector,
  type VideoProviderSelectorProps,
} from './video-provider-selector';

export function VideoProviderSelector({
  provider,
  videoProviderId,
  onProviderChange,
  onVideoIdChange,
  onDurationChange,
  onUploadComplete,
  disabled = false,
}: VideoProviderSelectorProps) {
  const {
    uploading,
    uploadProgress,
    selectedFile,
    videoPreview,
    videoDuration,
    detectingDuration,
    dragActive,
    fileInputRef,
    videoRef,
    handleExternalInputChange,
    handleFileInputChange,
    handleRemoveVideo,
    openFileDialog,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  } = useVideoProviderSelector({
    provider,
    videoProviderId,
    onVideoIdChange,
    onDurationChange,
    onUploadComplete,
  });

  return (
    <div className="space-y-4">
      <VideoProviderButtons provider={provider} disabled={disabled} onProviderChange={onProviderChange} />

      <div>
        {provider === 'direct' ? (
          <DirectVideoUpload
            selectedFile={selectedFile}
            videoProviderId={videoProviderId}
            videoPreview={videoPreview}
            videoDuration={videoDuration}
            uploading={uploading}
            uploadProgress={uploadProgress}
            disabled={disabled}
            dragActive={dragActive}
            fileInputRef={fileInputRef}
            videoRef={videoRef}
            onFileInputChange={handleFileInputChange}
            onRemoveVideo={handleRemoveVideo}
            onOpenFileDialog={openFileDialog}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        ) : (
          <VideoExternalInput
            provider={provider}
            value={videoProviderId}
            disabled={disabled}
            detectingDuration={detectingDuration}
            onChange={handleExternalInputChange}
          />
        )}
      </div>
    </div>
  );
}
