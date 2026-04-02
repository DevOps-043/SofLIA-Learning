import { ImageUploadCourse } from '../ImageUploadCourse'
import { CourseSkillsSelector } from '../../../courses/components/CourseSkillsSelector'
import type { InstructorConfigTabProps } from './types'

export function InstructorConfigTab({
  courseId,
  configData,
  setConfigData,
  handleConfigChange,
  handleSaveConfig,
  savingConfig,
  courseSkills,
  setCourseSkills,
  savingSkills,
}: InstructorConfigTabProps) {
  return (
    <div className="mt-6">
      <form onSubmit={handleSaveConfig} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
            <label className="block text-sm font-medium text-purple-200 mb-2">Título *</label>
            <input name="title" value={configData.title} onChange={handleConfigChange} className="w-full rounded-lg bg-gray-900 border border-purple-800/40 text-white px-4 py-2" />
          </div>
          <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
            <label className="block text-sm font-medium text-purple-200 mb-2">Descripción *</label>
            <textarea name="description" value={configData.description} onChange={handleConfigChange} rows={6} className="w-full rounded-lg bg-gray-900 border border-purple-800/40 text-white px-4 py-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
              <label className="block text-sm font-medium text-purple-200 mb-2">Categoría *</label>
              <select name="category" value={configData.category} onChange={handleConfigChange} className="w-full rounded-lg bg-gray-900 border border-purple-800/40 text-white px-4 py-2">
                <option value="ia">Inteligencia Artificial</option>
                <option value="tecnologia">Tecnología</option>
                <option value="negocios">Negocios</option>
                <option value="diseño">Diseño</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>
            <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
              <label className="block text-sm font-medium text-purple-200 mb-2">Nivel *</label>
              <select name="level" value={configData.level} onChange={handleConfigChange} className="w-full rounded-lg bg-gray-900 border border-purple-800/40 text-white px-4 py-2">
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
              <label className="block text-sm font-medium text-purple-200 mb-2">Duración (minutos) *</label>
              <input type="number" name="duration_total_minutes" value={configData.duration_total_minutes} onChange={handleConfigChange} className="w-full rounded-lg bg-gray-900 border border-purple-800/40 text-white px-4 py-2" />
            </div>
            <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
              <label className="block text-sm font-medium text-purple-200 mb-2">Precio</label>
              <input type="number" step="0.01" name="price" value={configData.price} onChange={handleConfigChange} className="w-full rounded-lg bg-gray-900 border border-purple-800/40 text-white px-4 py-2" />
            </div>
          </div>
          <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
            <label className="block text-sm font-medium text-purple-200 mb-2">Imagen del Curso</label>
            <ImageUploadCourse
              value={configData.thumbnail_url}
              onChange={(url) => setConfigData(prev => ({ ...prev, thumbnail_url: url }))}
              disabled={savingConfig}
            />
          </div>
          <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
            <label className="block text-sm font-medium text-purple-200 mb-2">Slug (URL)</label>
            <input name="slug" value={configData.slug} onChange={handleConfigChange} className="w-full rounded-lg bg-gray-900 border border-purple-800/40 text-white px-4 py-2" />
          </div>
          <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
            <label className="block text-sm font-medium text-purple-200 mb-4">
              Skills que se Aprenden en este Curso
            </label>
            <p className="text-xs text-purple-300/70 mb-4">
              Selecciona las skills que los estudiantes obtendrán al completar este curso. Estas aparecerán en su perfil.
            </p>
            <CourseSkillsSelector
              courseId={courseId}
              selectedSkills={courseSkills}
              onSkillsChange={setCourseSkills}
              disabled={savingConfig || savingSkills}
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
            <div className="text-purple-200 font-semibold mb-3">Acciones</div>
            <button type="submit" disabled={savingConfig} className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white disabled:opacity-60">
              {savingConfig ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
