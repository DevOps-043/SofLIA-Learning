'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Image, 
  FileText, 
  Video, 
  Youtube, 
  Link, 
  BarChart3,
  File,
  Download,
  ExternalLink
} from 'lucide-react';
import type { InlineAttachmentPayload } from '../InlineAttachmentButtons/InlineAttachmentButtons';

interface AttachmentPreviewProps {
  type: string;
  data: InlineAttachmentPayload;
  onRemove: () => void;
  className?: string;
}

function getStringValue(
  data: InlineAttachmentPayload,
  key: keyof InlineAttachmentPayload
): string | undefined {
  const value = data[key];
  return typeof value === 'string' ? value : undefined;
}

function getNumberValue(
  data: InlineAttachmentPayload,
  key: keyof InlineAttachmentPayload
): number | undefined {
  const value = data[key];
  return typeof value === 'number' ? value : undefined;
}

function getStringArrayValue(
  data: InlineAttachmentPayload,
  key: keyof InlineAttachmentPayload
): string[] | undefined {
  const value = data[key];
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
    ? value
    : undefined;
}

const getAttachmentIcon = (type: string) => {
  switch (type) {
    case 'image':
      return Image;
    case 'document':
      return FileText;
    case 'video':
      return Video;
    case 'youtube':
      return Youtube;
    case 'link':
      return Link;
    case 'poll':
      return BarChart3;
    default:
      return File;
  }
};

const getAttachmentColor = (type: string) => {
  switch (type) {
    case 'image':
      return 'from-pink-500 to-rose-500';
    case 'document':
      return 'from-blue-500 to-cyan-500';
    case 'video':
      return 'from-purple-500 to-violet-500';
    case 'youtube':
      return 'from-red-500 to-pink-500';
    case 'link':
      return 'from-green-500 to-emerald-500';
    case 'poll':
      return 'from-orange-500 to-amber-500';
    default:
      return 'from-gray-500 to-slate-500';
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function AttachmentPreview({ type, data, onRemove, className = '' }: AttachmentPreviewProps) {
  const IconComponent = getAttachmentIcon(type);
  const colorClass = getAttachmentColor(type);

  const renderContent = () => {
    switch (type) {
      case 'image':
        const imageUrl = getStringValue(data, 'url') ?? '';
        const imageName = getStringValue(data, 'name') ?? 'Imagen';
        const imageSize = getNumberValue(data, 'size') ?? 0;
        return (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-slate-700">
              <img 
                src={imageUrl} 
                alt={imageName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {imageName}
              </p>
              <p className="text-xs text-gray-600 dark:text-slate-400">
                {formatFileSize(imageSize)}
              </p>
            </div>
          </div>
        );

      case 'document':
      case 'video':
        const fileName = getStringValue(data, 'name') ?? 'Archivo';
        const fileSize = getNumberValue(data, 'size') ?? 0;
        return (
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {fileName}
              </p>
              <p className="text-xs text-gray-600 dark:text-slate-400">
                {formatFileSize(fileSize)}
              </p>
            </div>
          </div>
        );

      case 'youtube':
        const videoUrl = getStringValue(data, 'url') ?? '';
        return (
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
              <Youtube className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                Video de YouTube
              </p>
              <p className="text-xs text-gray-600 dark:text-slate-400 truncate">
                {videoUrl}
              </p>
            </div>
          </div>
        );

      case 'link':
        const linkUrl = getStringValue(data, 'url') ?? '';
        return (
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
              <Link className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                Enlace web
              </p>
              <p className="text-xs text-gray-600 dark:text-slate-400 truncate">
                {linkUrl}
              </p>
            </div>
          </div>
        );

      case 'poll':
        const pollQuestion = getStringValue(data, 'question') ?? 'Nueva encuesta';
        const pollOptions = getStringArrayValue(data, 'options') ?? [];
        return (
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {pollQuestion}
              </p>
              <p className="text-xs text-gray-600 dark:text-slate-400">
                {pollOptions.length} opciones
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
              <File className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                Archivo adjunto
              </p>
              <p className="text-xs text-gray-600 dark:text-slate-400">
                Tipo: {type}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`bg-gray-100 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600/50 rounded-lg p-3 ${className}`}
    >
      <div className="flex items-center justify-between">
        {renderContent()}
        <div className="flex items-center gap-2">
          {/* Botón de acción (opcional) */}
          {(type === 'youtube' || type === 'link') && (
            <button
              onClick={() => {
                const url = getStringValue(data, 'url');
                if (url) {
                  window.open(url, '_blank');
                }
              }}
              className="p-1 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Abrir enlace"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
          
          {/* Botón de descarga (para archivos) */}
          {(type === 'image' || type === 'document' || type === 'video') && (
            <button
              onClick={() => {
                const url = getStringValue(data, 'url');
                const name = getStringValue(data, 'name');
                if (!url || !name) {
                  return;
                }
                const link = document.createElement('a');
                link.href = url;
                link.download = name;
                link.click();
              }}
              className="p-1 text-gray-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              title="Descargar archivo"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Botón de eliminar */}
          <button
            onClick={onRemove}
            className="p-1 text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Eliminar adjunto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
