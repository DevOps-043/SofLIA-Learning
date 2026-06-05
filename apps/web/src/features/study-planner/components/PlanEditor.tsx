'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  Clock,
  Coffee,
  Loader2,
  Save,
  X,
} from 'lucide-react';
import { DAYS_OF_WEEK, SESSION_TYPES } from './PlanEditor.constants';
import { PlanEditorSection } from './PlanEditorSection';
import type { PlanEditorProps } from './PlanEditor.types';
export function PlanEditor({ plan, onSave, onCancel }: PlanEditorProps) {
  const [editedPlan, setEditedPlan] = useState(plan);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('courses');
  const toggleDay = (dayId: string) => {
    setEditedPlan(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(dayId)
        ? prev.selectedDays.filter(day => day !== dayId)
        : [...prev.selectedDays, dayId],
    }));
  };
  const toggleCourse = (courseId: string) => {
    setEditedPlan(prev => ({
      ...prev,
      courses: prev.courses.map(course =>
        course.courseId === courseId
          ? { ...course, isSelected: !course.isSelected }
          : course,
      ),
    }));
  };
  const changeSessionType = (type: 'short' | 'medium' | 'long') => {
    const sessionConfig = SESSION_TYPES.find(session => session.type === type);
    if (!sessionConfig) return;
    setEditedPlan(prev => ({
      ...prev,
      preferredSessionType: type,
      minSessionMinutes: sessionConfig.min,
      maxSessionMinutes: sessionConfig.max,
    }));
  };
  const handleSave = async () => {
    if (editedPlan.selectedDays.length === 0) {
      setError('Debes seleccionar al menos un dia de estudio.');
      return;
    }
    if (!editedPlan.courses.some(course => course.isSelected)) {
      setError('Debes seleccionar al menos un curso.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(editedPlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };
  const toggleSection = (section: string) => {
    setExpandedSection(prev => (prev === section ? null : section));
  };

  return (
    <div className="fixed inset-0 z-50 flex h-app-dynamic items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-2xl"
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar plan</h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div
          className="space-y-4 overflow-y-auto p-6"
          style={{ maxHeight: 'calc(var(--soflia-viewport-height) - 140px - 1rem)' }}
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre del plan
            </label>
            <input
              type="text"
              value={editedPlan.name}
              onChange={event => setEditedPlan(prev => ({ ...prev, name: event.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Mi plan de estudios"
            />
          </div>

          <PlanEditorSection
            id="courses"
            title="Cursos"
            icon={<BookOpen size={18} className="text-purple-500" />}
            isExpanded={expandedSection === 'courses'}
            onToggle={toggleSection}
          >
            <div className="space-y-2">
              {editedPlan.courses.map(course => (
                <label
                  key={course.courseId}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={course.isSelected}
                    onChange={() => toggleCourse(course.courseId)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-gray-900 dark:text-white">{course.title}</span>
                </label>
              ))}
            </div>
          </PlanEditorSection>

          <PlanEditorSection
            id="days"
            title="Dias de estudio"
            icon={<Calendar size={18} className="text-blue-500" />}
            isExpanded={expandedSection === 'days'}
            onToggle={toggleSection}
          >
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.id}
                  onClick={() => toggleDay(day.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    editedPlan.selectedDays.includes(day.id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </PlanEditorSection>

          <PlanEditorSection
            id="sessions"
            title="Duracion de sesiones"
            icon={<Clock size={18} className="text-green-500" />}
            isExpanded={expandedSection === 'sessions'}
            onToggle={toggleSection}
          >
            <div className="grid grid-cols-3 gap-3">
              {SESSION_TYPES.map(session => (
                <button
                  key={session.type}
                  onClick={() => changeSessionType(session.type)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    editedPlan.preferredSessionType === session.type
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                  }`}
                >
                  <p className="font-semibold text-gray-900 dark:text-white">{session.label}</p>
                  <p className="text-sm text-green-600 dark:text-green-400">{session.range}</p>
                </button>
              ))}
            </div>
          </PlanEditorSection>

          <PlanEditorSection
            id="breaks"
            title="Descansos"
            icon={<Coffee size={18} className="text-cyan-500" />}
            isExpanded={expandedSection === 'breaks'}
            onToggle={toggleSection}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duracion del descanso (minutos)
              </label>
              <input
                type="number"
                min={5}
                max={30}
                value={editedPlan.breakDurationMinutes}
                onChange={event => setEditedPlan(prev => ({
                  ...prev,
                  breakDurationMinutes: parseInt(event.target.value) || 10,
                }))}
                className="w-32 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Los descansos se programaran automaticamente segun la duracion de cada sesion.
              </p>
            </div>
          </PlanEditorSection>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle size={18} className="text-red-500" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={18} />
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
