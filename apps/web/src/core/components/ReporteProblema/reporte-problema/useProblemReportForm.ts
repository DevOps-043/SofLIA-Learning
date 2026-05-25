import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { buildReportPayload } from './reportPayload';
import { readFileAsDataUrl, validateScreenshotFile } from './fileUtils';
import type { Categoria, Prioridad, ReporteProblemProps } from './types';

export function useProblemReportForm({
  fromLia,
  isOpen,
  onClose,
  preselectedCategory,
  reportContext,
}: ReporteProblemProps & { fromLia: boolean }) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<Categoria>((preselectedCategory as Categoria) || 'bug');
  const [prioridad, setPrioridad] = useState<Prioridad>('media');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [pasosReproducir, setPasosReproducir] = useState('');
  const [comportamientoEsperado, setComportamientoEsperado] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setError(null);
    if (isOpen) {
      setStep('form');
      if (preselectedCategory) setCategoria(preselectedCategory as Categoria);
      return;
    }

    setTitulo('');
    setDescripcion('');
    setPasosReproducir('');
    setComportamientoEsperado('');
    setCategoria('bug');
    setPrioridad('media');
  }, [isOpen, preselectedCategory]);

  async function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const validationError = validateScreenshotFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setScreenshotFile(file);
    setScreenshotPreview(await readFileAsDataUrl(file));
  }

  function handleRemoveScreenshot() {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!titulo.trim()) throw new Error('El titulo es requerido');
      if (!descripcion.trim()) throw new Error('La descripcion es requerida');
      const screenshotData = screenshotFile ? await readFileAsDataUrl(screenshotFile) : null;
      const response = await fetch('/api/reportes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildReportPayload({
          categoria, comportamientoEsperado, descripcion, fromLia, pasosReproducir,
          prioridad, reportContext, screenshotData, titulo,
        })),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al enviar el reporte');
      }

      await response.json().catch(() => null);
      setStep('success');
      setTimeout(onClose, 3000);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Error desconocido');
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    categoria, comportamientoEsperado, descripcion, error, fileInputRef, handleFileSelect,
    handleRemoveScreenshot, handleSubmit, isSubmitting, pasosReproducir, prioridad,
    screenshotPreview, setCategoria, setComportamientoEsperado, setDescripcion,
    setPasosReproducir, setPrioridad, setTitulo, step, titulo,
  };
}

export type ProblemReportFormController = ReturnType<typeof useProblemReportForm>;
