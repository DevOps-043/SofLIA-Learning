'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import type { VideoProviderSelectorProps } from './types';
import {
  attachVideoMetadataListener,
  formatVideoDuration,
  requestVideoDuration,
  uploadCourseVideo,
  validateVideoFile,
} from './video-provider-selector.service';

export function useVideoProviderSelector({
  provider,
  videoProviderId,
  onVideoIdChange,
  onDurationChange,
  onUploadComplete,
}: Pick<
  VideoProviderSelectorProps,
  'provider' | 'videoProviderId' | 'onVideoIdChange' | 'onDurationChange' | 'onUploadComplete'
>) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState('');
  const [detectingDuration, setDetectingDuration] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (provider !== 'direct') {
      setVideoPreview(null);
      setSelectedFile(null);
      setVideoDuration('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const previewSource = selectedFile ? URL.createObjectURL(selectedFile) : videoProviderId || null;
    if (!previewSource) {
      setVideoPreview(null);
      setVideoDuration('');
      return;
    }

    setVideoPreview(previewSource);

    const detachMetadataListener = attachVideoMetadataListener(previewSource, (durationSeconds) => {
      setVideoDuration(formatVideoDuration(durationSeconds));
      onDurationChange?.(durationSeconds);
    });

    return () => {
      detachMetadataListener();
      if (selectedFile) {
        URL.revokeObjectURL(previewSource);
      }
    };
  }, [selectedFile, videoProviderId, provider, onDurationChange]);

  const handleUploadedUrl = (url: string) => {
    onVideoIdChange(url);
    onUploadComplete?.(url);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const videoUrl = await uploadCourseVideo(file, setUploadProgress);
      setUploadError(null);
      handleUploadedUrl(videoUrl);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al subir el video';
      setUploadError(`Error al subir el video: ${errorMessage}`);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateVideoFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }
    setUploadError(null);

    setSelectedFile(file);
    void handleFileUpload(file);
  };

  const handleExternalInputChange = async (value: string) => {
    onVideoIdChange(value);

    if (!value.trim()) {
      return;
    }

    setDetectingDuration(true);
    try {
      const duration = await requestVideoDuration(provider, value);
      if (duration && onDurationChange) {
        onDurationChange(duration);
      }
    } catch {
      // noop
    } finally {
      setDetectingDuration(false);
    }
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveVideo = () => {
    setSelectedFile(null);
    setVideoPreview(null);
    setVideoDuration('');
    onVideoIdChange('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      handleFileSelect(file);
    }
  };

  return {
    uploading,
    uploadProgress,
    uploadError,
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
  };
}
