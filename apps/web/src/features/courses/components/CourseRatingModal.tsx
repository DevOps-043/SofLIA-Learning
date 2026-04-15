'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

import { StarRating } from './StarRating';
import type { CourseRatingSubmissionInput } from '../services/course-rating.service';

export interface CourseRatingModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  /**
   * Callback when modal is closed
   */
  onClose: () => void;
  /**
   * Course title (for display)
   */
  courseTitle?: string;
  /**
   * Callback when rating is successfully submitted
   */
  onSubmit: (submission: CourseRatingSubmissionInput) => Promise<void>;
}

export function CourseRatingModal({
  isOpen,
  onClose,
  courseTitle,
  onSubmit,
}: CourseRatingModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [reviewTitle, setReviewTitle] = useState<string>('');
  const [reviewContent, setReviewContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

  const resetForm = () => {
    setRating(0);
    setReviewTitle('');
    setReviewContent('');
    setError(null);
    setShowCloseConfirmation(false);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Por favor selecciona una calificacion');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        rating,
        reviewTitle: reviewTitle.trim() || undefined,
        reviewContent: reviewContent.trim() || undefined,
      });

      resetForm();
      onClose();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Error al guardar la calificacion'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    if (rating === 0) {
      setShowCloseConfirmation(true);
      return;
    }

    resetForm();
    onClose();
  };

  const handleConfirmClose = () => {
    resetForm();
    setShowCloseConfirmation(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowCloseConfirmation(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(event) => event.stopPropagation()}
            className="relative bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xl max-w-md w-full p-6"
          >
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-slate-400" />
            </button>

            <div className="mb-8 text-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                Califica este curso
              </h3>
              {courseTitle && (
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">
                  {courseTitle}
                </p>
              )}
              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200/50 dark:border-blue-500/20 rounded-lg px-3 py-2 mt-4">
                <p className="text-blue-700 dark:text-blue-300 text-xs font-normal">
                  Para ver tu certificado, completa esta encuesta
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 dark:text-slate-300 text-sm font-medium mb-3 text-center">
                Como calificarias este curso?
              </label>
              <div className="flex justify-center">
                <StarRating
                  rating={rating}
                  editable={true}
                  onChange={setRating}
                  size="lg"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 dark:text-slate-300 text-sm font-medium mb-2">
                Titulo de tu resena{' '}
                <span className="text-gray-400 dark:text-slate-500 font-normal">
                  (opcional)
                </span>
              </label>
              <input
                type="text"
                value={reviewTitle}
                onChange={(event) => setReviewTitle(event.target.value)}
                placeholder="Ej: Excelente curso"
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-slate-800/50"
                maxLength={100}
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 dark:text-slate-300 text-sm font-medium mb-2">
                Comentarios{' '}
                <span className="text-gray-400 dark:text-slate-500 font-normal">
                  (opcional)
                </span>
              </label>
              <textarea
                value={reviewContent}
                onChange={(event) => setReviewContent(event.target.value)}
                placeholder="Comparte tu experiencia con este curso..."
                disabled={isSubmitting}
                rows={4}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-slate-800/50 resize-none"
                maxLength={1000}
              />
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5 text-right">
                {reviewContent.length}/1000
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-lg"
              >
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-700 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando y generando certificado...</span>
                </>
              ) : (
                <span>Enviar calificacion</span>
              )}
            </button>
          </motion.div>
        </motion.div>
      )}

      {showCloseConfirmation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={handleCancelClose}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(event) => event.stopPropagation()}
            className="relative bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xl max-w-sm w-full p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Salir sin completar?
            </h3>

            <p className="text-gray-600 dark:text-slate-400 mb-6 text-sm">
              Necesitas completar la encuesta para acceder a tu certificado. Estas
              seguro de que quieres salir?
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleCancelClose}
                className="flex-1 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-lg transition-colors hover:bg-gray-800 dark:hover:bg-gray-100"
              >
                Continuar encuesta
              </button>
              <button
                onClick={handleConfirmClose}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 font-medium rounded-lg transition-colors"
              >
                Salir
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
