'use client'

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/utils/date-formatter'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Film,
  Layers,
  Lock,
  Route,
  Search,
  Trash2,
  Users,
} from 'lucide-react'

import { BusinessAssignLearningPathModal } from './BusinessAssignLearningPathModal'
import { BusinessLearningPathVideosModal } from './BusinessLearningPathVideosModal'
import { useBusinessLearningPathsPageLogic } from '../hooks/useBusinessLearningPathsPageLogic'
import Joyride from 'react-joyride'
import { useFeatureTour } from '@/features/tours/hooks/useFeatureTour'
import { getAdminPathsSteps, ADMIN_PATHS_TOUR_ID } from '@/features/tours/config/business-panel/admin-paths-steps'
import type { BusinessUser } from '../services/businessUsers.service'

function getUserDisplayName(user: BusinessUser | null | undefined) {
  if (!user) return ''
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
  return user.display_name || fullName || user.email
}

export function BusinessLearningPathsPage() {
  const { t, i18n } = useTranslation('business')
  const logic = useBusinessLearningPathsPageLogic()
  const theme = logic.theme
  const [videosLearningPathId, setVideosLearningPathId] = useState<string | null>(null)

  const { joyrideProps } = useFeatureTour({
    tourId: ADMIN_PATHS_TOUR_ID,
    steps: getAdminPathsSteps(t),
    enabled: !logic.isLoading,
  })

  const selectedLearningPathForVideos = useMemo(
    () => logic.learningPaths.find((p) => p.id === videosLearningPathId) ?? null,
    [logic.learningPaths, videosLearningPathId],
  )

  const { primaryColor, onPrimaryColor, accentColor, textColor, mutedTextColor, borderColor, inputBg, panelBg, successColor, dangerColor } = theme

  const assignmentCards = logic.assignments
    .slice()
    .sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime())

  if (logic.isLoading) {
    return (
      <div className="min-h-screen p-6 lg:p-8 space-y-5">
        {[80, 60, 200].map((h, i) => (
          <div key={i} className="animate-pulse rounded-[2rem]" style={{ height: h, backgroundColor: inputBg }} />
        ))}
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-[2rem]" style={{ height: 280, backgroundColor: inputBg }} />
          ))}
        </div>
      </div>
    )
  }

  const stats = [
    { icon: Route, label: 'Rutas activas', value: logic.learningPaths.length },
    { icon: BookOpen, label: 'Talleres', value: logic.totalWorkshops },
    { icon: Users, label: 'Con ruta asignada', value: logic.totalAssignedUsers },
    { icon: CheckCircle2, label: 'Asignaciones activas', value: logic.assignments.length },
  ]

  return (
    <>
    <Joyride {...joyrideProps} />
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-5 lg:p-8 space-y-6"
      style={{ backgroundColor: panelBg }}
    >
      {/* ── Hero ── */}
      <div
        id="tour-paths-hero"
        className="relative overflow-hidden rounded-[2rem] border px-8 py-8 lg:py-10"
        style={{ borderColor, backgroundColor: inputBg }}
      >
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-64 opacity-20 blur-3xl"
          style={{ background: `radial-gradient(circle, ${accentColor}, transparent)` }}
        />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-2" style={{ color: mutedTextColor }}>
              Gestión de rutas
            </p>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight mb-2" style={{ color: textColor }}>
              Rutas de aprendizaje
            </h1>
            <p className="text-sm max-w-md" style={{ color: mutedTextColor }}>
              Asigna a tus usuarios las rutas creadas por la plataforma directamente desde el panel de empresa.
            </p>
          </div>
          <div
            className="hidden lg:flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.4rem] shadow-xl"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
          >
            <Route className="h-7 w-7" style={{ color: onPrimaryColor }} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div id="tour-paths-stats" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-4 rounded-[1.5rem] border p-5"
              style={{ backgroundColor: inputBg, borderColor }}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: `linear-gradient(135deg, ${primaryColor}20, ${accentColor}20)`, color: primaryColor }}
              >
                <Icon className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: mutedTextColor }}>{stat.label}</p>
                <p className="text-2xl font-black leading-none mt-1" style={{ color: textColor }}>{stat.value}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ── Feedback ── */}
      {logic.feedback && (
        <div
          className="flex items-center justify-between gap-4 rounded-[1.5rem] border px-6 py-3.5 text-sm font-semibold"
          style={{
            backgroundColor: logic.feedback.type === 'success' ? `${successColor}12` : `${dangerColor}12`,
            borderColor: logic.feedback.type === 'success' ? `${successColor}28` : `${dangerColor}28`,
            color: logic.feedback.type === 'success' ? successColor : dangerColor,
          }}
        >
          <p>{logic.feedback.message}</p>
          <button type="button" onClick={() => logic.setFeedback(null)} className="text-[9px] font-black uppercase tracking-widest">OK</button>
        </div>
      )}
      {logic.error && (
        <div
          className="rounded-[1.5rem] border px-6 py-3.5 text-sm font-medium"
          style={{ backgroundColor: `${dangerColor}12`, borderColor: `${dangerColor}28`, color: dangerColor }}
        >
          {logic.error}
        </div>
      )}

      {/* ── Search ── */}
      <div id="tour-paths-search" className="relative">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-40" style={{ color: textColor }} />
        <input
          value={logic.searchTerm}
          onChange={(e) => logic.setSearchTerm(e.target.value)}
          placeholder="Buscar por ruta, descripción o taller..."
          className="w-full rounded-[1.5rem] border py-4 pl-12 pr-5 text-sm focus:outline-none transition-all"
          style={{ backgroundColor: inputBg, borderColor, color: textColor }}
        />
      </div>

      {/* ── LP Cards ── */}
      <section id="tour-paths-cards">
        {logic.filteredLearningPaths.length === 0 ? (
          <div
            className="rounded-[2rem] border border-dashed px-8 py-16 text-center"
            style={{ backgroundColor: inputBg, borderColor }}
          >
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.4rem] shadow-xl"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
            >
              <Route className="h-8 w-8" style={{ color: onPrimaryColor }} strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-black" style={{ color: textColor }}>No hay rutas disponibles</h2>
            <p className="mt-2 text-sm max-w-sm mx-auto" style={{ color: mutedTextColor }}>
              Cuando el equipo administrador cree rutas activas, aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {logic.filteredLearningPaths.map((path, index) => {
              const assignedCount = logic.assignmentsByPathId.get(path.id)?.length ?? 0
              return (
                <motion.article
                  key={path.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="flex flex-col overflow-hidden rounded-[2rem] border"
                  style={{ backgroundColor: inputBg, borderColor }}
                >
                  {/* Card header */}
                  <div className="p-6 pb-4 border-b" style={{ borderColor }}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                        style={{ background: `linear-gradient(135deg, ${primaryColor}20, ${accentColor}20)`, color: primaryColor }}
                      >
                        <Layers className="h-5 w-5" strokeWidth={2.5} />
                      </div>
                      <div
                        className="px-2.5 py-1 rounded-xl border text-[9px] font-black uppercase tracking-wider"
                        style={{ backgroundColor: panelBg, borderColor, color: mutedTextColor }}
                      >
                        {path.item_count} {path.item_count === 1 ? 'taller' : 'talleres'}
                      </div>
                    </div>
                    <h2 className="text-base font-black leading-snug mb-1" style={{ color: textColor }}>
                      {path.title}
                    </h2>
                    {path.description && (
                      <p className="text-xs line-clamp-2" style={{ color: mutedTextColor }}>{path.description}</p>
                    )}
                  </div>

                  {/* Course preview */}
                  {path.items.length > 0 && (
                    <div className="px-6 py-4 space-y-2 border-b flex-1" style={{ borderColor }}>
                      <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: mutedTextColor }}>
                        Contenido
                      </p>
                      {path.items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2.5 rounded-2xl border px-4 py-2.5"
                          style={{ backgroundColor: panelBg, borderColor }}
                        >
                          <span
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-[9px] font-black"
                            style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                          >
                            {item.position}
                          </span>
                          <p className="truncate text-xs font-medium" style={{ color: textColor }}>
                            {item.course?.title ?? 'Taller sin título'}
                          </p>
                          {item.position === 1
                            ? null
                            : <Lock className="ml-auto h-3 w-3 shrink-0 opacity-30" style={{ color: textColor }} />
                          }
                        </div>
                      ))}
                      {path.items.length > 3 && (
                        <p className="pl-2 text-xs" style={{ color: mutedTextColor }}>
                          +{path.items.length - 3} más
                        </p>
                      )}
                    </div>
                  )}

                  {/* Card footer */}
                  <div className="p-5 flex flex-col gap-2.5">
                    <p className="text-xs" style={{ color: mutedTextColor }}>
                      {assignedCount} {assignedCount === 1 ? 'usuario asignado' : 'usuarios asignados'}
                    </p>
                    <div className="flex items-center gap-2">
                      {/* Gestionar videos */}
                      <button
                        type="button"
                        onClick={() => setVideosLearningPathId(path.id)}
                        className="flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all hover:opacity-80"
                        style={{ backgroundColor: panelBg, borderColor, color: mutedTextColor }}
                      >
                        <Film className="h-3.5 w-3.5" />
                        {t('learningPathsPage.introVideos.manageVideos')}
                      </button>
                      {/* Asignar usuarios */}
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => logic.setSelectedLearningPathId(path.id)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-[9px] font-black uppercase tracking-widest shadow-lg transition-all"
                        style={{ backgroundColor: primaryColor, color: onPrimaryColor }}
                      >
                        <Users className="h-3.5 w-3.5" />
                        Asignar
                        <ChevronRight className="h-3.5 w-3.5" strokeWidth={3} />
                      </motion.button>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Active assignments ── */}
      <section id="tour-paths-assignments">
        <div className="mb-5">
          <h2 className="text-lg font-black" style={{ color: textColor }}>Asignaciones activas</h2>
          <p className="mt-0.5 text-sm" style={{ color: mutedTextColor }}>
            Revisa qué usuarios tienen cada ruta y revoca accesos cuando sea necesario.
          </p>
        </div>

        {assignmentCards.length === 0 ? (
          <div
            className="rounded-[2rem] border border-dashed px-8 py-12 text-center"
            style={{ backgroundColor: inputBg, borderColor }}
          >
            <Users className="mx-auto mb-3 h-8 w-8 opacity-30" style={{ color: textColor }} />
            <p className="font-black" style={{ color: textColor }}>Sin asignaciones todavía</p>
            <p className="mt-1 text-sm" style={{ color: mutedTextColor }}>
              Asigna una ruta a tus usuarios desde las tarjetas de arriba.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[2rem] border" style={{ borderColor }}>
            {/* Table header */}
            <div
              className="hidden grid-cols-[1fr_1fr_130px_auto] items-center gap-4 border-b px-6 py-3.5 md:grid"
              style={{ backgroundColor: panelBg, borderColor }}
            >
              {['Usuario', 'Ruta', 'Asignado', ''].map((h) => (
                <p key={h} className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: mutedTextColor }}>{h}</p>
              ))}
            </div>

            {/* Rows */}
            <div style={{ backgroundColor: inputBg }}>
              {assignmentCards.map((assignment, i) => (
                <div
                  key={assignment.id}
                  className="flex flex-col gap-3 p-4 md:grid md:grid-cols-[1fr_1fr_130px_auto] md:items-center md:gap-4 md:px-6 md:py-4"
                  style={{ borderTop: `1px solid ${i === 0 ? 'transparent' : borderColor}` }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: textColor }}>
                      {getUserDisplayName(assignment.user) || 'Usuario sin nombre'}
                    </p>
                    <p className="text-xs truncate" style={{ color: mutedTextColor }}>{assignment.user?.email}</p>
                  </div>

                  <p className="text-sm truncate font-medium" style={{ color: textColor }}>
                    {assignment.learning_path?.title ?? assignment.learning_path_id}
                  </p>

                  <p className="text-xs tabular-nums" style={{ color: mutedTextColor }}>
                    {formatDate(assignment.assigned_at, i18n.language, {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => void logic.handleRevokeAssignment(assignment.id)}
                    disabled={logic.revokingAssignmentId === assignment.id}
                    className="inline-flex items-center gap-2 self-start rounded-xl border px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-40 md:self-auto"
                    style={{
                      backgroundColor: `${dangerColor}0d`,
                      borderColor: `${dangerColor}25`,
                      color: dangerColor,
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {logic.revokingAssignmentId === assignment.id ? 'Revocando…' : 'Revocar'}
                  </motion.button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Modals ── */}
      <BusinessAssignLearningPathModal
        isOpen={Boolean(logic.selectedLearningPath)}
        onClose={() => logic.setSelectedLearningPathId(null)}
        orgSlug={logic.orgSlug}
        learningPath={logic.selectedLearningPath}
        users={logic.users}
        isLoadingUsers={logic.loadingUsers}
        existingAssignments={logic.selectedPathAssignments}
        onAssigned={logic.handleAssignmentCreated}
      />

      <BusinessLearningPathVideosModal
        isOpen={Boolean(videosLearningPathId)}
        onClose={() => setVideosLearningPathId(null)}
        orgSlug={logic.orgSlug}
        learningPath={selectedLearningPathForVideos}
      />
    </motion.div>
    </>
  )
}
