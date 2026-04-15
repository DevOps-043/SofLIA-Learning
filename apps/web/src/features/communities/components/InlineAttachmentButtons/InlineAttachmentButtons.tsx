'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Image, 
  FileText, 
  Video, 
  Youtube, 
  Link, 
  BarChart3,
  Upload
} from 'lucide-react';

export type InlineAttachmentTypeId =
  | 'image'
  | 'document'
  | 'video'
  | 'youtube'
  | 'link'
  | 'poll';

export interface InlineAttachmentPayload extends Record<string, unknown> {
  file?: File;
  url?: string | ArrayBuffer | null;
  name?: string;
  size?: number;
  mimeType?: string;
  type?: string;
}

interface InlineAttachmentButtonsProps {
  onAttachmentSelect: (
    type: InlineAttachmentTypeId,
    data: InlineAttachmentPayload | null
  ) => void;
  className?: string;
  currentAttachmentsCount?: number;
  maxAttachments?: number;
}

interface AttachmentType {
  id: InlineAttachmentTypeId;
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

const attachmentTypes: AttachmentType[] = [
  {
    id: 'image',
    name: 'Imagen',
    icon: Image,
    color: 'from-pink-500 to-rose-500',
    description: 'Subir una imagen'
  },
  {
    id: 'document',
    name: 'Documento',
    icon: FileText,
    color: 'from-blue-500 to-cyan-500',
    description: 'PDF, Word, Excel, etc.'
  },
  {
    id: 'video',
    name: 'Video',
    icon: Video,
    color: 'from-purple-500 to-violet-500',
    description: 'Subir un video'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: 'from-red-500 to-pink-500',
    description: 'Enlace de YouTube'
  },
  {
    id: 'link',
    name: 'Enlace',
    icon: Link,
    color: 'from-green-500 to-emerald-500',
    description: 'Enlace web'
  },
  {
    id: 'poll',
    name: 'Encuesta',
    icon: BarChart3,
    color: 'from-orange-500 to-amber-500',
    description: 'Crear una encuesta'
  }
];

export function InlineAttachmentButtons({ 
  onAttachmentSelect, 
  className = '',
  currentAttachmentsCount = 0,
  maxAttachments = 3
}: InlineAttachmentButtonsProps) {
  const [selectedType, setSelectedType] = useState<InlineAttachmentTypeId | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttachmentTypeSelect = (type: AttachmentType) => {
    // Verificar límite
    if (currentAttachmentsCount >= maxAttachments) {
      setLimitError(`Máximo ${maxAttachments} adjuntos por publicación`);
      return;
    }
    setLimitError(null);

    setSelectedType(type.id);
    
    if (type.id === 'image' || type.id === 'document' || type.id === 'video') {
      // Abrir selector de archivos
      if (fileInputRef.current) {
        fileInputRef.current.accept = type.id === 'image' ? 'image/*' : 
                                     type.id === 'video' ? 'video/*' : 
                                     '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt';
        fileInputRef.current.click();
      }
    } else {
      // Abrir modal específico para el tipo
      onAttachmentSelect(type.id, null);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedType) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Determinar el tipo real basado en el MIME type
        let actualType = selectedType;
        if (file.type.startsWith('image/')) {
          actualType = 'image';
        } else if (file.type.startsWith('video/')) {
          actualType = 'video';
        } else {
          actualType = 'document';
        }

        const data: InlineAttachmentPayload = {
          file,
          url: e.target?.result,
          name: file.name,
          size: file.size,
          mimeType: file.type,
          type: actualType
        };
        onAttachmentSelect(actualType, data);
      };
      reader.readAsDataURL(file);
    }
    setSelectedType(null);
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {limitError && (
        <p className="text-xs text-red-400">{limitError}</p>
      )}
      <div className="flex items-center justify-center gap-2">
      {/* Grupo 1: Archivos */}
      <div className="flex items-center gap-1">
        {attachmentTypes.slice(0, 3).map((type) => {
          const IconComponent = type.icon;
          return (
            <motion.button
              key={type.id}
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleAttachmentTypeSelect(type)
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-200 group ${
                type.id === 'image' 
                  ? 'bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 hover:text-pink-300' :
                type.id === 'document'
                  ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300' :
                type.id === 'video'
                  ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300' :
                  'bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 hover:text-slate-300'
              }`}
              title={type.description}
            >
              <IconComponent className="w-4 h-4" />
              <span className="text-xs font-medium hidden lg:block">{type.name}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Separador visual */}
      <div className="w-px h-6 bg-gray-300 dark:bg-slate-600/50 mx-1" />

      {/* Grupo 2: Enlaces y Encuestas */}
      <div className="flex items-center gap-1">
        {attachmentTypes.slice(3).map((type) => {
          const IconComponent = type.icon;
          return (
            <motion.button
              key={type.id}
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleAttachmentTypeSelect(type)
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-200 group ${
                type.id === 'youtube'
                  ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300' :
                type.id === 'link'
                  ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400 hover:text-green-300' :
                type.id === 'poll'
                  ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300' :
                  'bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 hover:text-slate-300'
              }`}
              title={type.description}
            >
              <IconComponent className="w-4 h-4" />
              <span className="text-xs font-medium hidden lg:block">{type.name}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Input de archivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
    </div>
  );
}
