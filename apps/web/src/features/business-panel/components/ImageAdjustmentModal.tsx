'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, RotateCw, ZoomIn, ZoomOut, Maximize2, Minimize2, Move } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { useTranslation } from 'react-i18next';
import type { Area } from 'react-easy-crop';
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme';

interface ImageAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (adjustments: ImageAdjustments) => void;
  initialAdjustments?: ImageAdjustments;
}

export interface ImageAdjustments {
  position: { x: number; y: number };
  zoom: number;
  rotation: number;
  objectFit: 'cover' | 'contain' | 'fill';
}

export function ImageAdjustmentModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  onSave,
  initialAdjustments 
}: ImageAdjustmentModalProps) {
  const [crop, setCrop] = useState(initialAdjustments?.position || { x: 0, y: 0 });
  const [zoom, setZoom] = useState(initialAdjustments?.zoom || 1);
  const [rotation, setRotation] = useState(initialAdjustments?.rotation || 0);
  const [objectFit, setObjectFit] = useState<'cover' | 'contain' | 'fill'>(
    initialAdjustments?.objectFit || 'cover'
  );
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const { t } = useTranslation('business');
  const theme = useBusinessPanelTheme();
  const cropperObjectFit = objectFit === 'fill' ? 'contain' : objectFit;
  const activeFitButtonStyle = {
    backgroundColor: theme.actionColor,
    color: theme.onActionColor,
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = () => {
    onSave({
      position: crop,
      zoom,
      rotation,
      objectFit
    });
    onClose();
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setObjectFit('cover');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="relative bg-carbon-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-carbon-600 w-full max-w-4xl max-h-[90vh] flex flex-col z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-carbon-700">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Move className="w-6 h-6" style={{ color: theme.actionColor }} />
              {t('imageAdjustment.title')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-carbon-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-carbon-400 hover:text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Preview Area */}
            <div className="relative w-full h-96 bg-carbon-800 rounded-lg overflow-hidden">
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={undefined}
                showGrid={false}
                restrictPosition={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                objectFit={cropperObjectFit}
                style={{
                  containerStyle: {
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'var(--color-legacy-1e293b)',
                  },
                }}
              />
            </div>

            {/* Controls */}
            <div className="space-y-4">
              {/* Object Fit */}
              <div>
                <label className="block text-sm font-medium text-carbon-300 mb-3">
                  {t('imageAdjustment.labels.adjustment')}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setObjectFit('cover')}
                    className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                      objectFit === 'cover'
                        ? ''
                        : 'bg-carbon-800 text-carbon-300 hover:bg-carbon-700'
                    }`}
                    style={objectFit === 'cover' ? activeFitButtonStyle : undefined}
                  >
                    <Maximize2 className="w-4 h-4" />
                    {t('imageAdjustment.fit.cover')}
                  </button>
                  <button
                    onClick={() => setObjectFit('contain')}
                    className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                      objectFit === 'contain'
                        ? ''
                        : 'bg-carbon-800 text-carbon-300 hover:bg-carbon-700'
                    }`}
                    style={objectFit === 'contain' ? activeFitButtonStyle : undefined}
                  >
                    <Minimize2 className="w-4 h-4" />
                    {t('imageAdjustment.fit.contain')}
                  </button>
                  <button
                    onClick={() => setObjectFit('fill')}
                    className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                      objectFit === 'fill'
                        ? ''
                        : 'bg-carbon-800 text-carbon-300 hover:bg-carbon-700'
                    }`}
                    style={objectFit === 'fill' ? activeFitButtonStyle : undefined}
                  >
                    <Move className="w-4 h-4" />
                    {t('imageAdjustment.fit.fill')}
                  </button>
                </div>
              </div>

              {/* Zoom Control */}
              <div>
                <label className="block text-sm font-medium text-carbon-300 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ZoomIn className="w-4 h-4" />
                    {t('imageAdjustment.labels.zoom')}: {zoom.toFixed(1)}x
                  </span>
                  <button
                    onClick={() => setZoom(1)}
                    className="text-xs px-2 py-1 bg-carbon-800 hover:bg-carbon-700 rounded transition-colors"
                  >
                    {t('imageAdjustment.buttons.reset')}
                  </button>
                </label>
                <div className="flex items-center gap-3">
                  <ZoomOut className="w-5 h-5 text-carbon-400" />
                  <input
                    type="range"
                    min={0.5}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 h-2 bg-carbon-700 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <ZoomIn className="w-5 h-5 text-carbon-400" />
                </div>
              </div>

              {/* Rotation Control */}
              <div>
                <label className="block text-sm font-medium text-carbon-300 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <RotateCw className="w-4 h-4" />
                    {t('imageAdjustment.labels.rotation')}: {rotation}°
                  </span>
                  <button
                    onClick={() => setRotation(0)}
                    className="text-xs px-2 py-1 bg-carbon-800 hover:bg-carbon-700 rounded transition-colors"
                  >
                    {t('imageAdjustment.buttons.reset')}
                  </button>
                </label>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={15}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full h-2 bg-carbon-700 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Position Info */}
              <div className="bg-carbon-800 rounded-lg p-4">
                <p className="text-sm text-carbon-400">
                  <span className="font-medium text-carbon-300">{t('imageAdjustment.labels.position')}:</span> X: {crop.x.toFixed(0)}, Y: {crop.y.toFixed(0)}
                </p>
                <p className="text-xs text-carbon-500 mt-1">
                  {t('imageAdjustment.labels.dragHint')}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 p-6 border-t border-carbon-700">
            <button
              onClick={handleReset}
              className="px-6 py-3 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              style={{
                backgroundColor: theme.secondaryColor
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <RotateCw className="w-5 h-5" />
              {t('imageAdjustment.buttons.resetAll')}
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 text-white rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: theme.secondaryColor
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                {t('imageAdjustment.buttons.cancel')}
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-3 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                style={{
                  backgroundColor: theme.actionColor,
                  color: theme.onActionColor
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <Save className="w-5 h-5" />
                {t('imageAdjustment.buttons.save')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
