'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Book, FileText, Flag, Clock, BarChart3, Users2, DollarSign, Settings, Award, CheckCircle2 } from 'lucide-react'
import { ImageUploadCourse } from '../../../instructor/components/ImageUploadCourse'
import { CourseSkillsSelector, CourseSkill } from '../../../courses/components/CourseSkillsSelector'
import {
  COURSE_MANAGEMENT_ACTION_BUTTON_CLASS,
  COURSE_MANAGEMENT_ACCENT_ICON_CLASS,
  COURSE_MANAGEMENT_DIVIDER_CLASS,
  COURSE_MANAGEMENT_FIELD_CARD_CLASS,
  COURSE_MANAGEMENT_FIELD_ICON_CLASS,
  COURSE_MANAGEMENT_INPUT_WITH_ICON_CLASS,
  COURSE_MANAGEMENT_LABEL_CLASS,
  COURSE_MANAGEMENT_LABEL_WITH_MARGIN_CLASS,
  COURSE_MANAGEMENT_MUTED_TEXT_CLASS,
  COURSE_MANAGEMENT_PANEL_CARD_CLASS,
  COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS,
  COURSE_MANAGEMENT_SELECT_WITH_ICON_CLASS,
  COURSE_MANAGEMENT_STICKY_CARD_CLASS,
  COURSE_MANAGEMENT_TEXTAREA_CLASS,
} from './courseManagementTheme'
import { useCourseManagementContext } from './CourseManagementContext'

export function CourseConfigTab() {
  const {
    isNewCourse,
    configData, setConfigData, handleConfigChange, handleSaveConfig, savingConfig,
    instructors,
    selectedCertificateTemplate, setSelectedCertificateTemplate,
    instructorSignatureUrl, instructorSignatureName,
    courseSkills, setCourseSkills, savingSkills,
    showTemplatePreview, setShowTemplatePreview,
  } = useCourseManagementContext().state
  const { courseId } = useCourseManagementContext()

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
            className={COURSE_MANAGEMENT_FIELD_CARD_CLASS}
          >
            <label className={COURSE_MANAGEMENT_LABEL_WITH_MARGIN_CLASS}>
              Título *
            </label>
            <div className="relative">
              <Book className={COURSE_MANAGEMENT_FIELD_ICON_CLASS} />
              <input
                name="title"
                value={configData.title}
                onChange={handleConfigChange}
                className={COURSE_MANAGEMENT_INPUT_WITH_ICON_CLASS}
                placeholder="Ej: IA Esencial para Principiantes"
              />
            </div>
          </motion.div>

          {/* Descripción */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className={COURSE_MANAGEMENT_PANEL_CARD_CLASS}
          >
            <label className={COURSE_MANAGEMENT_LABEL_WITH_MARGIN_CLASS}>
              Descripción *
            </label>
            <textarea
              name="description"
              value={configData.description}
              onChange={handleConfigChange}
              rows={6}
              className={COURSE_MANAGEMENT_TEXTAREA_CLASS}
              placeholder="Describe el contenido y objetivos del curso..."
            />
          </motion.div>

          {/* Categoría y Nivel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={COURSE_MANAGEMENT_FIELD_CARD_CLASS}
            >
              <label className={COURSE_MANAGEMENT_LABEL_WITH_MARGIN_CLASS}>
                Categoría *
              </label>
              <div className="relative">
                <Flag className={COURSE_MANAGEMENT_FIELD_ICON_CLASS} />
                <select
                  name="category"
                  value={configData.category}
                  onChange={handleConfigChange}
                  className={COURSE_MANAGEMENT_SELECT_WITH_ICON_CLASS}
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
              className={COURSE_MANAGEMENT_FIELD_CARD_CLASS}
            >
              <label className={COURSE_MANAGEMENT_LABEL_WITH_MARGIN_CLASS}>
                Nivel *
              </label>
              <div className="relative">
                <BarChart3 className={COURSE_MANAGEMENT_FIELD_ICON_CLASS} />
                <select
                  name="level"
                  value={configData.level}
                  onChange={handleConfigChange}
                  className={COURSE_MANAGEMENT_SELECT_WITH_ICON_CLASS}
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
              className={COURSE_MANAGEMENT_FIELD_CARD_CLASS}
            >
              <label className={COURSE_MANAGEMENT_LABEL_WITH_MARGIN_CLASS}>
                Duración (minutos) *
              </label>
              <div className="relative">
                <Clock className={COURSE_MANAGEMENT_FIELD_ICON_CLASS} />
                <input
                  type="number"
                  name="duration_total_minutes"
                  value={configData.duration_total_minutes}
                  onChange={handleConfigChange}
                  className={COURSE_MANAGEMENT_INPUT_WITH_ICON_CLASS}
                  placeholder="60"
                />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className={COURSE_MANAGEMENT_FIELD_CARD_CLASS}
            >
              <label className={COURSE_MANAGEMENT_LABEL_WITH_MARGIN_CLASS}>
                Precio
              </label>
              <div className="relative">
                <DollarSign className={COURSE_MANAGEMENT_FIELD_ICON_CLASS} />
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={configData.price}
                  onChange={handleConfigChange}
                  className={COURSE_MANAGEMENT_INPUT_WITH_ICON_CLASS}
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
            className={COURSE_MANAGEMENT_PANEL_CARD_CLASS}
          >
            <label className={COURSE_MANAGEMENT_LABEL_WITH_MARGIN_CLASS}>
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
            className={COURSE_MANAGEMENT_FIELD_CARD_CLASS}
          >
            <label className={COURSE_MANAGEMENT_LABEL_WITH_MARGIN_CLASS}>
              Slug (URL)
            </label>
            <div className="relative">
              <FileText className={COURSE_MANAGEMENT_FIELD_ICON_CLASS} />
              <input
                name="slug"
                value={configData.slug}
                onChange={handleConfigChange}
                className={COURSE_MANAGEMENT_INPUT_WITH_ICON_CLASS}
                placeholder="ia-esencial-principiantes"
              />
            </div>
          </motion.div>

          {/* Instructor Selector */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.48 }}
            className={COURSE_MANAGEMENT_FIELD_CARD_CLASS}
          >
            <label className={COURSE_MANAGEMENT_LABEL_WITH_MARGIN_CLASS}>
              Instructor *
            </label>
            <div className="relative">
              <Users2 className={COURSE_MANAGEMENT_FIELD_ICON_CLASS} />
              <select
                name="instructor_id"
                value={configData.instructor_id}
                onChange={handleConfigChange}
                className={COURSE_MANAGEMENT_SELECT_WITH_ICON_CLASS}
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
            className={COURSE_MANAGEMENT_PANEL_CARD_CLASS}
          >
            <div className="flex items-center gap-2 mb-2">
              <Award className={`w-4 h-4 ${COURSE_MANAGEMENT_ACCENT_ICON_CLASS}`} />
              <label className={COURSE_MANAGEMENT_LABEL_CLASS}>
                Skills que se Aprenden en este Curso
              </label>
            </div>
            <p className={`mb-4 ml-6 text-xs ${COURSE_MANAGEMENT_MUTED_TEXT_CLASS}`}>
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
            className={COURSE_MANAGEMENT_STICKY_CARD_CLASS}
          >
            <div className={`mb-4 flex items-center gap-2 border-b pb-4 ${COURSE_MANAGEMENT_DIVIDER_CLASS}`}>
              <Settings className={`w-4 h-4 ${COURSE_MANAGEMENT_ACCENT_ICON_CLASS}`} />
              <div className={`text-sm font-bold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>Acciones</div>
            </div>
            <motion.button
              type="submit"
              disabled={savingConfig}
              whileHover={{ scale: savingConfig ? 1 : 1.02, y: savingConfig ? 0 : -2 }}
              whileTap={{ scale: savingConfig ? 1 : 0.98 }}
              className={COURSE_MANAGEMENT_ACTION_BUTTON_CLASS}
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


