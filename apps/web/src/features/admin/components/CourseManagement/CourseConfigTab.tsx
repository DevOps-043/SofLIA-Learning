'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Book, FileText, Flag, Clock, BarChart3, Users2, DollarSign, Settings, Award, CheckCircle2 } from 'lucide-react'
import { ImageUploadCourse } from '@/features/instructor/components/ImageUploadCourse'
import { CourseSkillsSelector, CourseSkill } from '@/features/courses/components/CourseSkillsSelector'
import type { useCourseManagementLogic } from './hooks/useCourseManagementLogic'

type CourseManagementState = ReturnType<typeof useCourseManagementLogic>

interface CourseConfigTabProps extends CourseManagementState {}

export function CourseConfigTab(props: CourseConfigTabProps) {
  const {
    isNewCourse,
    configData, handleConfigChange, handleSaveConfig, savingConfig,
    instructors,
    selectedCertificateTemplate, setSelectedCertificateTemplate,
    instructorSignatureUrl, instructorSignatureName,
    courseSkills, setCourseSkills, savingSkills,
    showTemplatePreview, setShowTemplatePreview,
  } = props

  return (
    <motion.div
      key="config"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <form onSubmit={handleSaveConfig} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-5">
          {/* Título */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="group bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 hover:border-[#00D4B3]/30 transition-all duration-200"
          >
            <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
              Título *
            </label>
            <div className="relative">
              <Book className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
              <input
                name="title"
                value={configData.title}
                onChange={handleConfigChange}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                placeholder="Ej: IA Esencial para Principiantes"
              />
            </div>
          </motion.div>

          {/* Descripción */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 hover:border-[#00D4B3]/30 transition-all duration-200"
          >
            <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
              Descripción *
            </label>
            <textarea
              name="description"
              value={configData.description}
              onChange={handleConfigChange}
              rows={6}
              className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Describe el contenido y objetivos del curso..."
            />
          </motion.div>

          {/* Categoría y Nivel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="group bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 hover:border-[#00D4B3]/30 transition-all duration-200"
            >
              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                Categoría *
              </label>
              <div className="relative">
                <Flag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                <select
                  name="category"
                  value={configData.category}
                  onChange={handleConfigChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                  title="Selecciona la categoría del curso"
                >
                  <option value="ia">Inteligencia Artificial</option>
                  <option value="tecnologia">Tecnología</option>
                  <option value="negocios">Negocios</option>
                  <option value="diseño">Diseño</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="group bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 hover:border-[#00D4B3]/30 transition-all duration-200"
            >
              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                Nivel *
              </label>
              <div className="relative">
                <BarChart3 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                <select
                  name="level"
                  value={configData.level}
                  onChange={handleConfigChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                  title="Selecciona el nivel del curso"
                >
                  <option value="beginner">Principiante</option>
                  <option value="intermediate">Intermedio</option>
                  <option value="advanced">Avanzado</option>
                </select>
              </div>
            </motion.div>
          </div>

          {/* Duración y Precio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="group bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 hover:border-[#00D4B3]/30 transition-all duration-200"
            >
              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                Duración (minutos) *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                <input
                  type="number"
                  name="duration_total_minutes"
                  value={configData.duration_total_minutes}
                  onChange={handleConfigChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                  placeholder="60"
                />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="group bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 hover:border-[#00D4B3]/30 transition-all duration-200"
            >
              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                Precio
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={configData.price}
                  onChange={handleConfigChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                  placeholder="0.00"
                />
              </div>
            </motion.div>
          </div>

          {/* Imagen del Curso */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 hover:border-[#00D4B3]/30 transition-all duration-200"
          >
            <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
              Imagen del Curso
            </label>
            <ImageUploadCourse
              value={configData.thumbnail_url}
              onChange={(url) => setConfigData(prev => ({ ...prev, thumbnail_url: url }))}
              disabled={savingConfig}
            />
          </motion.div>

          {/* Slug */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 }}
            className="group bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 hover:border-[#00D4B3]/30 transition-all duration-200"
          >
            <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
              Slug (URL)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
              <input
                name="slug"
                value={configData.slug}
                onChange={handleConfigChange}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                placeholder="ia-esencial-principiantes"
              />
            </div>
          </motion.div>

          {/* Instructor Selector */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.48 }}
            className="group bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 hover:border-[#00D4B3]/30 transition-all duration-200"
          >
            <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
              Instructor *
            </label>
            <div className="relative">
              <Users2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
              <select
                name="instructor_id"
                value={configData.instructor_id}
                onChange={handleConfigChange}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
              >
                <option value="">Selecciona un instructor</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>

          {/* Skills */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 hover:border-[#00D4B3]/30 transition-all duration-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-[#00D4B3]" />
              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 uppercase tracking-wide">
                Skills que se Aprenden en este Curso
              </label>
            </div>
            <p className="text-xs text-[#6C757D] dark:text-white/60 mb-4 ml-6">
              Selecciona las skills que los estudiantes obtendrán al completar este curso. Estas aparecerán en su perfil.
            </p>
            <CourseSkillsSelector
              courseId={courseId}
              selectedSkills={courseSkills}
              onSkillsChange={setCourseSkills}
              disabled={savingConfig || savingSkills}
            />
          </motion.div>
        </div>

        {/* Columna Lateral - Acciones */}
        <div className="space-y-5">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 sticky top-5"
          >
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
              <Settings className="w-4 h-4 text-[#00D4B3]" />
              <div className="text-sm font-bold text-[#0A2540] dark:text-white">Acciones</div>
            </div>
            <motion.button
              type="submit"
              disabled={savingConfig}
              whileHover={{ scale: savingConfig ? 1 : 1.02, y: savingConfig ? 0 : -2 }}
              whileTap={{ scale: savingConfig ? 1 : 0.98 }}
              className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 hover:from-[#0d2f4d] hover:to-[#0A2540] text-white disabled:opacity-50 transition-all font-medium text-sm shadow-md hover:shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {savingConfig ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar configuración</span>
                </>
              )}
            </motion.button>
          </motion.div>
        </div>
      </form>
    </motion.div>
  )
}
