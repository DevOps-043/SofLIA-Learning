'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Trash2, GripVertical, FileQuestion, CheckCircle2, Circle } from 'lucide-react'

export interface QuizQuestion {
  id: string
  question: string
  questionType: 'multiple_choice' | 'true_false' | 'short_answer'
  options?: string[]
  correctAnswer: string
  explanation?: string
  points: number
}

interface QuizBuilderProps {
  questions: QuizQuestion[]
  onChange: (questions: QuizQuestion[]) => void
}

type QuizQuestionValue = QuizQuestion[keyof QuizQuestion]

export function QuizBuilder({ questions, onChange }: QuizBuilderProps) {
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: '',
      questionType: 'multiple_choice',
      options: [''],
      correctAnswer: '',
      explanation: '',
      points: 1
    }
    onChange([...questions, newQuestion])
  }

  const updateQuestion = (
    id: string,
    field: keyof QuizQuestion,
    value: QuizQuestionValue
  ) => {
    onChange(questions.map(q => {
      if (q.id === id) {
        const updated = { ...q, [field]: value } as QuizQuestion
        
        // Si se cambia el tipo a true_false, inicializar opciones automáticamente
        if (field === 'questionType' && value === 'true_false') {
          updated.options = ['Verdadero', 'Falso']
          // Si no hay respuesta correcta, establecerla vacía
          if (!updated.correctAnswer || (updated.correctAnswer !== 'Verdadero' && updated.correctAnswer !== 'Falso')) {
            updated.correctAnswer = ''
          }
        }
        
        // Si se cambia de true_false a otro tipo, limpiar opciones si es necesario
        if (field === 'questionType' && value !== 'true_false' && q.questionType === 'true_false') {
          if (value === 'multiple_choice' && (!updated.options || updated.options.length === 0)) {
            updated.options = ['']
          }
        }
        
        return updated
      }
      return q
    }))
  }

  const deleteQuestion = (id: string) => {
    onChange(questions.filter(q => q.id !== id))
  }

  const addOption = (questionId: string) => {
    onChange(questions.map(q => 
      q.id === questionId 
        ? { ...q, options: [...(q.options || []), ''] }
        : q
    ))
  }

  const updateOption = (questionId: string, index: number, value: string) => {
    onChange(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options?.map((opt, i) => i === index ? value : opt)
          }
        : q
    ))
  }

  const removeOption = (questionId: string, index: number) => {
    onChange(questions.map(q => 
      q.id === questionId 
        ? { ...q, options: q.options?.filter((_, i) => i !== index) }
        : q
    ))
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#00D4B3]/20 flex items-center justify-center">
            <FileQuestion className="h-4 w-4 text-[#00D4B3]" />
          </div>
          <h4 className="text-base font-bold text-[#0A2540] dark:text-white">Preguntas del Quiz</h4>
        </div>
        <motion.button
          type="button"
          onClick={addQuestion}
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 hover:from-[#0d2f4d] hover:to-[#0A2540] text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Pregunta</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {questions.map((question, index) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="p-5 bg-white dark:bg-[#0A0D12] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#00D4B3]/30 transition-all duration-200"
          >
            {/* Header de la pregunta */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-[#00D4B3]">{index + 1}</span>
                </div>
                <span className="text-sm font-semibold text-[#0A2540] dark:text-white">Pregunta {index + 1}</span>
              </div>
              <motion.button
                type="button"
                onClick={() => deleteQuestion(question.id)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Tipo de pregunta */}
            <div className="mb-4 group">
              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                Tipo de Pregunta
              </label>
              <div className="relative">
                <FileQuestion className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                <select
                  value={question.questionType}
                  onChange={(e) => updateQuestion(question.id, 'questionType', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value="multiple_choice">Opción Múltiple</option>
                  <option value="true_false">Verdadero/Falso</option>
                  <option value="short_answer">Respuesta Corta</option>
                </select>
              </div>
            </div>

            {/* Pregunta */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                Pregunta *
              </label>
              <textarea
                value={question.question}
                onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                placeholder="Escribe la pregunta aquí..."
                rows={2}
                className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 resize-none"
              />
            </div>

            {/* Opciones (solo para multiple_choice) */}
            {question.questionType === 'multiple_choice' && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-2 uppercase tracking-wide">
                  Opciones
                </label>
                <div className="space-y-2">
                  {question.options?.map((option, optIndex) => {
                    const isCorrect = question.correctAnswer === option
                    return (
                      <motion.div
                        key={optIndex}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: optIndex * 0.05 }}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                          isCorrect
                            ? 'bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 border-[#00D4B3]/30 dark:border-[#00D4B3]/40'
                            : 'bg-[#E9ECEF]/30 dark:bg-[#0A0D12] border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#00D4B3]/30'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => updateQuestion(question.id, 'correctAnswer', option)}
                          className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200"
                          style={{
                            borderColor: isCorrect ? '#00D4B3' : '#6C757D',
                            backgroundColor: isCorrect ? '#00D4B3' : 'transparent'
                          }}
                        >
                          {isCorrect && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            >
                              <div className="w-2 h-2 rounded-full bg-white" />
                            </motion.div>
                          )}
                        </button>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                          placeholder={`Opción ${optIndex + 1}`}
                          className="flex-1 px-3 py-2 bg-transparent border-none text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:outline-none focus:ring-0"
                        />
                        {question.options && question.options.length > 1 && (
                          <motion.button
                            type="button"
                            onClick={() => removeOption(question.id, optIndex)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                          >
                            <X className="w-4 h-4" />
                          </motion.button>
                        )}
                      </motion.div>
                    )
                  })}
                  <motion.button
                    type="button"
                    onClick={() => addOption(question.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#00D4B3] hover:text-[#00D4B3] hover:bg-[#00D4B3]/10 dark:hover:bg-[#00D4B3]/20 rounded-lg transition-all duration-200 border border-[#00D4B3]/20 dark:border-[#00D4B3]/30"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar Opción</span>
                  </motion.button>
                </div>
              </div>
            )}

            {/* Respuesta correcta (para true_false y short_answer) */}
            {(question.questionType === 'true_false' || question.questionType === 'short_answer') && (
              <div className="mb-4 group">
                <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                  Respuesta Correcta *
                </label>
                {question.questionType === 'true_false' ? (
                  <div className="relative">
                    <CheckCircle2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                    <select
                      value={question.correctAnswer}
                      onChange={(e) => updateQuestion(question.id, 'correctAnswer', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Verdadero">Verdadero</option>
                      <option value="Falso">Falso</option>
                    </select>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={question.correctAnswer}
                    onChange={(e) => updateQuestion(question.id, 'correctAnswer', e.target.value)}
                    placeholder="Respuesta correcta..."
                    className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                  />
                )}
              </div>
            )}

            {/* Explicación */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                Explicación (Opcional)
              </label>
              <textarea
                value={question.explanation || ''}
                onChange={(e) => updateQuestion(question.id, 'explanation', e.target.value)}
                placeholder="Explica por qué esta es la respuesta correcta..."
                rows={2}
                className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 resize-none"
              />
            </div>

            {/* Puntos */}
            <div className="group">
              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                Puntos
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <input
                  type="number"
                  value={question.points}
                  onChange={(e) => updateQuestion(question.id, 'points', parseInt(e.target.value) || 1)}
                  min="1"
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {questions.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 px-4 border-2 border-dashed border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl bg-[#E9ECEF]/30 dark:bg-[#0A0D12]"
        >
          <FileQuestion className="w-12 h-12 mx-auto mb-3 text-[#6C757D] dark:text-white/40" />
          <p className="text-sm text-[#6C757D] dark:text-white/60 font-medium">
            No hay preguntas. Haz clic en "Agregar Pregunta" para comenzar.
          </p>
        </motion.div>
      )}
    </div>
  )
}
