'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { 
  Paperclip, 
  Image, 
  FileText, 
  Link, 
  Play, 
  BarChart3,
  X,
  Upload,
  File,
  Video,
  Youtube,
  CheckCircle
} from 'lucide-react';

interface AttachmentButtonProps {
  onAttachmentSelect: (type: string, data: AttachmentSelectionData | null) => void;
  className?: string;
}

type AttachmentSelectionData = {
  file?: File;
  url?: string | ArrayBuffer | null;
} & Record<string, unknown>;

interface AttachmentType {
  id: string;
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

export function AttachmentButton({ onAttachmentSelect, className = '' }: AttachmentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [attachmentData, setAttachmentData] = useState<AttachmentSelectionData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0, width: 0, openUpward: false });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const modalHeight = 400; // Altura aproximada del modal
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Si no hay espacio abajo pero sí arriba, abrir hacia arriba
      const openUpward = spaceBelow < modalHeight && spaceAbove > modalHeight;
      
      setButtonPosition({
        top: openUpward 
          ? rect.top + window.scrollY - modalHeight - 8
          : rect.bottom + window.scrollY + 8,
        left: Math.max(8, Math.min(rect.left + window.scrollX, window.innerWidth - 320 - 8)), // 320px = width del modal
        width: rect.width,
        openUpward
      });
    }
  }, [isOpen]);

  const handleAttachmentTypeSelect = (type: AttachmentType) => {
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
      setIsOpen(false);
      onAttachmentSelect(type.id, null);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedType) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = {
          file,
          url: e.target?.result,
          name: file.name,
          size: file.size,
          type: file.type
        };
        setAttachmentData(data);
        onAttachmentSelect(selectedType, data);
      };
      reader.readAsDataURL(file);
    }
    setSelectedType(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      const fileType = file.type.startsWith('image/') ? 'image' :
                      file.type.startsWith('video/') ? 'video' : 'document';
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = {
          file,
          url: e.target?.result,
          name: file.name,
          size: file.size,
          type: file.type
        };
        setAttachmentData(data);
        onAttachmentSelect(fileType, data);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Botón principal */}
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 rounded-lg text-slate-300 hover:text-white transition-all duration-200"
      >
        <Paperclip className="w-4 h-4" />
        <span className="text-sm font-medium">Adjuntar</span>
      </motion.button>

      {/* Modal de selección usando Portal */}
      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 z-[9998]"
                onClick={() => setIsOpen(false)}
              />
              
              {/* Modal */}
              <motion.div
                initial={{ 
                  opacity: 0, 
                  scale: 0.9, 
                  y: buttonPosition.openUpward ? -10 : 10 
                }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: 0 
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.9, 
                  y: buttonPosition.openUpward ? -10 : 10 
                }}
                transition={{ duration: 0.2 }}
                className="fixed w-80 max-h-[400px] bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-[9999] overflow-hidden"
                style={{
                  top: `${buttonPosition.top}px`,
                  left: `${buttonPosition.left}px`,
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
            {/* Header */}
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Adjuntar contenido</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Selecciona el tipo de contenido que quieres adjuntar
              </p>
            </div>

            {/* Drag & Drop Area */}
            {dragOver && (
              <div className="absolute inset-0 bg-blue-500/20 border-2 border-dashed border-blue-400 rounded-xl flex items-center justify-center z-[10000]">
                <div className="text-center">
                  <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-blue-400 font-medium">Suelta el archivo aquí</p>
                </div>
              </div>
            )}

            {/* Opciones de adjunto */}
            <div className="p-4 overflow-y-auto max-h-[280px]">
              <div className="grid grid-cols-2 gap-3">
                {attachmentTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <motion.button
                      key={type.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAttachmentTypeSelect(type)}
                      className="flex flex-col items-center gap-3 p-4 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 rounded-lg transition-all duration-200 group"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-center">
                        <h4 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                          {type.name}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {type.description}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-700 bg-slate-900/50">
              <p className="text-xs text-slate-500 text-center">
                También puedes arrastrar y soltar archivos directamente
              </p>
            </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Input de archivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
