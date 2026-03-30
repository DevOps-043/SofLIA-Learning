'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BarChart3, Plus, Trash2, Clock } from 'lucide-react';

interface PollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pollData: any) => void;
}

interface PollOption {
  id: string;
  text: string;
}

export function PollModal({ isOpen, onClose, onConfirm }: PollModalProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<PollOption[]>([
    { id: '1', text: '' },
    { id: '2', text: '' }
  ]);
  const [duration, setDuration] = useState('7'); // días
  const [isLoading, setIsLoading] = useState(false);

  const addOption = () => {
    if (options.length < 10) {
      const newId = (options.length + 1).toString();
      setOptions([...options, { id: newId, text: '' }]);
    }
  };

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter(option => option.id !== id));
    }
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map(option => 
      option.id === id ? { ...option, text } : option
    ));
  };

  const isValid = question.trim() && options.every(option => option.text.trim());

  const handleConfirm = async () => {
    if (!isValid) return;

    setIsLoading(true);
    try {
      // Crear estructura de datos compatible con el sistema de votación
      const optionTexts = options.map(option => option.text.trim());

      // Inicializar votes con cada opción como key y array vacío como valor
      const initialVotes: Record<string, string[]> = {};
      optionTexts.forEach(optionText => {
        initialVotes[optionText] = [];
      });

      const pollData = {
        question: question.trim(),
        options: optionTexts,
        duration: parseInt(duration),
        type: 'poll',
        votes: initialVotes,        // Objeto con arrays vacíos para cada opción
        userVotes: {}                // Objeto vacío para mapear userId → opción votada
      };

      onConfirm(pollData);
      // Reset form
      setQuestion('');
      setOptions([
        { id: '1', text: '' },
        { id: '2', text: '' }
      ]);
      setDuration('7');
      onClose();
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Crear encuesta</h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Haz una pregunta a la comunidad</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Pregunta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Pregunta
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="¿Cuál es tu opinión sobre...?"
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            {/* Opciones */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Opciones
                </label>
                <button
                  onClick={addOption}
                  disabled={options.length >= 10}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:bg-gray-50 dark:disabled:bg-slate-800 disabled:opacity-50 text-gray-700 dark:text-slate-300 text-sm rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              </div>
              
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-xs text-gray-600 dark:text-slate-400 font-medium">
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => updateOption(option.id, e.target.value)}
                      placeholder={`Opción ${index + 1}`}
                      className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                    />
                    {options.length > 2 && (
                      <button
                        onClick={() => removeOption(option.id)}
                        className="p-2 text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Duración */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Duración de la encuesta
              </label>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                >
                  <option value="1">1 día</option>
                  <option value="3">3 días</option>
                  <option value="7">1 semana</option>
                  <option value="14">2 semanas</option>
                  <option value="30">1 mes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-900 dark:text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isValid || isLoading}
              className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 dark:disabled:bg-slate-600 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" />
                  Crear encuesta
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
