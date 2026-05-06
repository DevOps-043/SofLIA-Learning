'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertCircle,
  Lightbulb,
  FileText,
  Zap,
  Palette,
  HelpCircle,
  Upload,
  Send,
  CheckCircle,
  Loader2,
  type LucideIcon
} from 'lucide-react';
import type { ReportProblemRequestContext } from '../../reporting/report-problem.contract';

interface ReporteProblemProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCategory?: string;
  fromLia?: boolean;
  reportContext?: ReportProblemRequestContext;
}

type Categoria = 'bug' | 'sugerencia' | 'contenido' | 'performance' | 'ui-ux' | 'otro';
type Prioridad = 'baja' | 'media' | 'alta' | 'critica';

const categorias: { value: Categoria; label: string; icon: LucideIcon; color: string; bgColor: string; borderColor: string }[] = [
  { value: 'bug', label: 'Bug / Error', icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-500' },
  { value: 'sugerencia', label: 'Sugerencia', icon: Lightbulb, color: 'text-[#F59E0B] dark:text-[#F59E0B]', bgColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-[#F59E0B]' },
  { value: 'contenido', label: 'Problema de Contenido', icon: FileText, color: 'text-[#0A2540] dark:text-[#00D4B3]', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-[#0A2540] dark:border-[#00D4B3]' },
  { value: 'performance', label: 'Performance', icon: Zap, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/20', borderColor: 'border-purple-500' },
  { value: 'ui-ux', label: 'Diseño / UX', icon: Palette, color: 'text-pink-600 dark:text-pink-400', bgColor: 'bg-pink-50 dark:bg-pink-900/20', borderColor: 'border-pink-500' },
  { value: 'otro', label: 'Otro', icon: HelpCircle, color: 'text-[#6C757D] dark:text-[#6C757D]', bgColor: 'bg-gray-50 dark:bg-gray-800/50', borderColor: 'border-[#6C757D]' }
];

const prioridades: { value: Prioridad; label: string }[] = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Crítica' }
];

export function ReporteProblema({
  isOpen,
  onClose,
  preselectedCategory,
  fromLia = false,
  reportContext,
}: ReporteProblemProps) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Datos del formulario
  const [categoria, setCategoria] = useState<Categoria>(preselectedCategory as Categoria || 'bug');
  const [prioridad, setPrioridad] = useState<Prioridad>('media');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [pasosReproducir, setPasosReproducir] = useState('');
  const [comportamientoEsperado, setComportamientoEsperado] = useState('');

  // Reset form cuando se abre o cierra
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setError(null);
      setScreenshotFile(null);
      setScreenshotPreview(null);
      if (preselectedCategory) {
        setCategoria(preselectedCategory as Categoria);
      }
    } else {
      setScreenshotFile(null);
      setScreenshotPreview(null);
      setTitulo('');
      setDescripcion('');
      setPasosReproducir('');
      setComportamientoEsperado('');
      setCategoria('bug');
      setPrioridad('media');
      setError(null);
    }
  }, [isOpen, preselectedCategory]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('La imagen es demasiado grande. Máximo 10MB');
      return;
    }

    setError(null);
    setScreenshotFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validaciones
      if (!titulo.trim()) {
        throw new Error('El título es requerido');
      }
      if (!descripcion.trim()) {
        throw new Error('La descripción es requerida');
      }

      // Capturar información del navegador y pantalla
      const userAgent = navigator.userAgent;
      const screenResolution = `${window.screen.width}x${window.screen.height}`;
      const navegador = navigator.userAgent.match(/(chrome|firefox|safari|edge|opera)/i)?.[0] || 'Desconocido';

      // Convertir File a base64 si hay screenshot
      let screenshotData = null;
      if (screenshotFile) {
        const reader = new FileReader();
        screenshotData = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(screenshotFile);
        });
      }

      const reportData = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        categoria,
        prioridad,
        pagina_url: window.location.href,
        pathname: window.location.pathname,
        user_agent: userAgent,
        screen_resolution: screenResolution,
        navegador,
        pasos_reproducir: pasosReproducir.trim() || null,
        comportamiento_esperado: comportamientoEsperado.trim() || null,
        screenshot_data: screenshotData,
        from_lia: fromLia,
        report_context: reportContext,
      };

      const response = await fetch('/api/reportes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al enviar el reporte');
      }

      await response.json().catch(() => null);
      // Mostrar pantalla de éxito
      setStep('success');

      // Cerrar automáticamente después de 3 segundos
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        data-reporte-modal
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-[#1E2329] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-[#E9ECEF] dark:border-[#6C757D]/30"
        >
          {/* Header */}
          <div className="bg-[#0A2540] p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              {step === 'form' ? 'Reportar un Problema' : '¡Reporte Enviado!'}
            </h2>
            <p className="text-white/80 text-base" style={{ fontFamily: 'Inter, sans-serif' }}>
              {step === 'form' 
                ? 'Ayúdanos a mejorar reportando problemas o sugerencias'
                : 'Gracias por tu reporte. Lo revisaremos pronto.'
              }
            </p>
            
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] scrollbar-hide">
            {step === 'form' ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-[#0A2540] dark:text-white mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Categoría *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {categorias.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = categoria === cat.value;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setCategoria(cat.value)}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            isSelected
                              ? `${cat.borderColor} ${cat.bgColor} shadow-sm`
                              : 'border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#1E2329] hover:border-[#00D4B3]/50 dark:hover:border-[#00D4B3]/50'
                          }`}
                        >
                          <Icon className={`w-5 h-5 mx-auto mb-1.5 ${cat.color}`} />
                          <span className={`text-xs font-medium ${isSelected ? 'text-[#0A2540] dark:text-white' : 'text-[#0A2540] dark:text-white/80'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                            {cat.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Prioridad */}
                <div>
                  <label className="block text-sm font-medium text-[#0A2540] dark:text-white mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Prioridad
                  </label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value as Prioridad)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#1E2329] text-[#0A2540] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-[#00D4B3] transition-all"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {prioridades.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-[#0A2540] dark:text-white mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Título *
                  </label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Resumen breve del problema"
                    maxLength={200}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#1E2329] text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-[#6C757D] focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-[#00D4B3] transition-all"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    required
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-[#0A2540] dark:text-white mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Descripción *
                  </label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Describe el problema en detalle..."
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#1E2329] text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-[#6C757D] focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-[#00D4B3] resize-none transition-all"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    required
                  />
                </div>

                {/* Pasos para reproducir (opcional) */}
                <div>
                  <label className="block text-sm font-medium text-[#0A2540] dark:text-white mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Pasos para reproducir (opcional)
                  </label>
                  <textarea
                    value={pasosReproducir}
                    onChange={(e) => setPasosReproducir(e.target.value)}
                    placeholder="1. Haz clic en...&#10;2. Navega a...&#10;3. El error ocurre cuando..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#1E2329] text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-[#6C757D] focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-[#00D4B3] resize-none transition-all"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                </div>

                {/* Comportamiento esperado (opcional) */}
                <div>
                  <label className="block text-sm font-medium text-[#0A2540] dark:text-white mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Comportamiento esperado (opcional)
                  </label>
                  <textarea
                    value={comportamientoEsperado}
                    onChange={(e) => setComportamientoEsperado(e.target.value)}
                    placeholder="¿Qué esperabas que sucediera?"
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#1E2329] text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-[#6C757D] focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-[#00D4B3] resize-none transition-all"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                </div>

                {/* Captura de pantalla */}
                <div>
                  <label className="block text-sm font-medium text-[#0A2540] dark:text-white mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Captura de pantalla (opcional)
                  </label>
                  {screenshotPreview ? (
                    <div className="relative">
                      <img 
                        src={screenshotPreview} 
                        alt="Screenshot preview" 
                        className="w-full rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 max-h-64 object-contain"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveScreenshot}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="screenshot-upload"
                      />
                      <label
                        htmlFor="screenshot-upload"
                        className="w-full py-3 px-4 border-2 border-dashed border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl hover:border-[#00D4B3] dark:hover:border-[#00D4B3] transition-colors flex items-center justify-center gap-2 text-[#6C757D] dark:text-[#6C757D] hover:text-[#00D4B3] dark:hover:text-[#00D4B3] bg-white dark:bg-[#1E2329] cursor-pointer"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        <Upload className="w-5 h-5" />
                        Subir Imagen
                      </label>
                      <p className="text-xs text-[#6C757D] dark:text-[#6C757D] mt-2 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Máximo 10MB. Formatos: JPG, PNG, GIF
                      </p>
                    </div>
                  )}
                </div>

                {/* Error message */}
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-600 dark:text-red-400 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {error}
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 text-[#0A2540] dark:text-white bg-white dark:bg-[#1E2329] hover:bg-[#E9ECEF] dark:hover:bg-[#0F1419] transition-colors disabled:opacity-50 font-medium"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !titulo.trim() || !descripcion.trim()}
                    className="flex-1 px-6 py-3 rounded-xl bg-[#0A2540] dark:bg-[#0A2540] text-white font-semibold hover:bg-[#0d2f4d] dark:hover:bg-[#0d2f4d] hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Enviar Reporte
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Success Screen */
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-[#10B981]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-[#10B981]" />
                </div>
                <h3 className="text-2xl font-bold text-[#0A2540] dark:text-white mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                  ¡Reporte Enviado con Éxito!
                </h3>
                <p className="text-[#6C757D] dark:text-[#6C757D] mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Gracias por ayudarnos a mejorar. Revisaremos tu reporte pronto.
                </p>
                <button
                  onClick={onClose}
                  className="px-8 py-3 rounded-xl bg-[#0A2540] dark:bg-[#0A2540] text-white font-semibold hover:bg-[#0d2f4d] dark:hover:bg-[#0d2f4d] hover:shadow-lg transition-all"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
