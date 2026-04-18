'use client'

import { motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Layers,
  Route,
  Search,
  Trash2,
  Users,
} from 'lucide-react'

import { BusinessAssignLearningPathModal } from './BusinessAssignLearningPathModal'
import { useBusinessLearningPathsPageLogic } from '../hooks/useBusinessLearningPathsPageLogic'
import type { BusinessUser } from '../services/businessUsers.service'

function getUserDisplayName(user: BusinessUser | null | undefined) {
  if (!user) return ''
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
  return user.display_name || fullName || user.email
}

export function BusinessLearningPathsPage() {
  const logic = useBusinessLearningPathsPageLogic()
  const theme = logic.theme

  const assignmentCards = logic.assignments
    .slice()
    .sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime())

  if (logic.isLoading) {
    return (
      <div className="min-h-screen p-6 lg:p-8 space-y-6">
        <div className="h-32 animate-pulse rounded-[1.5rem]" style={{ backgroundColor: theme.cardBg }} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-[1.25rem]" style={{ backgroundColor: theme.cardBg }} />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-[1.5rem]" style={{ backgroundColor: theme.cardBg }} />
          ))}
        </div>
      </div>
    )
  }

  const stats = [
    { icon: Route, label: 'Rutas activas', value: logic.learningPaths.length },
    { icon: BookOpen, label: 'Talleres', value: logic.totalWorkshops },
    { icon: Users, label: 'Usuarios con rutas', value: logic.totalAssignedUsers },
    { icon: CheckCircle2, label: 'Asignaciones activas', value: logic.assignments.length },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-6 lg:p-8 space-y-6"
    >
      {/* ── Hero card ── */}
      <motion.section
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[1.75rem] border p-8"
        style={{ background: theme.heroBackground, borderColor: theme.heroBorderColor }}
      >
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-72 opacity-40 blur-3xl"
          style={{ backgroundColor: `${theme.accentColor}40` }}
        />
        <div className="relative z-10">
          <div
            className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em]"
            style={{ borderColor: theme.inverseBorderColor, color: theme.inverseSubtextColor }}
          >
            <Route className="h-3.5 w-3.5" />
            Gestión de rutas
          </div>
          <h1 className="text-3xl font-black lg:text-4xl" style={{ color: theme.inverseTextColor }}>
            Rutas de aprendizaje
          </h1>
          <p className="mt-2 max-w-xl text-sm lg:text-base" style={{ color: theme.inverseSubtextColor }}>
            Asigna a tus usuarios las rutas creadas por la plataforma directamente desde el panel de empresa.
          </p>
        </div>
      </motion.section>

      {/* ── Stats ── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-4 rounded-2xl border p-4"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: theme.subtextColor }}>{stat.label}</p>
                <p className="text-2xl font-black leading-none mt-0.5" style={{ color: theme.textColor }}>{stat.value}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ── Feedback / Error ── */}
      {logic.feedback && (
        <div
          className="flex items-center justify-between gap-4 rounded-2xl border px-5 py-3"
          style={{
            backgroundColor: logic.feedback.type === 'success' ? `${theme.successColor}12` : `${theme.dangerColor}12`,
            borderColor: logic.feedback.type === 'success' ? `${theme.successColor}28` : `${theme.dangerColor}28`,
            color: logic.feedback.type === 'success' ? theme.successColor : theme.dangerColor,
          }}
        >
          <p className="text-sm font-semibold">{logic.feedback.message}</p>
          <button type="button" onClick={() => logic.setFeedback(null)} className="text-xs font-black uppercase tracking-widest">OK</button>
        </div>
      )}
      {logic.error && (
        <div
          className="rounded-2xl border px-5 py-3 text-sm font-medium"
          style={{ backgroundColor: `${theme.dangerColor}12`, borderColor: `${theme.dangerColor}28`, color: theme.dangerColor }}
        >
          {logic.error}
        </div>
      )}

      {/* ── Buscador ── */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: theme.subtextColor }} />
        <input
          value={logic.searchTerm}
          onChange={(e) => logic.setSearchTerm(e.target.value)}
          placeholder="Buscar por ruta, descripción o taller..."
          className="w-full rounded-2xl border py-3 pl-11 pr-4 text-sm outline-none"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textColor }}
        />
      </div>

      {/* ── Rutas ── */}
      <section>
        {logic.filteredLearningPaths.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed px-6 py-14 text-center"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
          >
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}
            >
              <Route className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-black" style={{ color: theme.textColor }}>No hay rutas disponibles</h2>
            <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: theme.subtextColor }}>
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
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="flex flex-col overflow-hidden rounded-2xl border"
                  style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
                >
                  {/* Accent bar */}
                  <div
                    className="h-1 w-full"
                    style={{ background: `linear-gradient(90deg, ${theme.brandColor}, ${theme.accentColor})` }}
                  />

                  <div className="flex flex-1 flex-col p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div
                          className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                          style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}
                        >
                          <Layers className="h-3 w-3" />
                          Ruta secuencial
                        </div>
                        <h2 className="text-base font-black leading-snug" style={{ color: theme.textColor }}>
                          {path.title}
                        </h2>
                        {path.description && (
                          <p className="mt-1.5 text-xs line-clamp-2" style={{ color: theme.subtextColor }}>
                            {path.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Mini stats */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div
                        className="rounded-xl border p-3"
                        style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: theme.subtextColor }}>Talleres</p>
                        <p className="mt-1 text-xl font-black" style={{ color: theme.textColor }}>{path.item_count}</p>
                      </div>
                      <div
                        className="rounded-xl border p-3"
                        style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: theme.subtextColor }}>Asignados</p>
                        <p className="mt-1 text-xl font-black" style={{ color: theme.textColor }}>{assignedCount}</p>
                      </div>
                    </div>

                    {/* Course preview */}
                    {path.items.length > 0 && (
                      <div className="mt-4 space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: theme.subtextColor }}>
                          Vista previa
                        </p>
                        {path.items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2.5 rounded-xl border px-3 py-2"
                            style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}
                          >
                            <span
                              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                              style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}
                            >
                              {item.position}
                            </span>
                            <p className="truncate text-xs font-medium" style={{ color: theme.textColor }}>
                              {item.course?.title ?? 'Taller sin título'}
                            </p>
                          </div>
                        ))}
                        {path.items.length > 3 && (
                          <p className="pl-1 text-[11px]" style={{ color: theme.subtextColor }}>
                            +{path.items.length - 3} más
                          </p>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div
                      className="mt-5 flex items-center justify-between gap-3 border-t pt-4"
                      style={{ borderColor: theme.borderColor }}
                    >
                      <p className="text-xs" style={{ color: theme.subtextColor }}>
                        {assignedCount} {assignedCount === 1 ? 'usuario asignado' : 'usuarios asignados'}
                      </p>
                      <button
                        type="button"
                        onClick={() => logic.setSelectedLearningPathId(path.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition hover:opacity-90"
                        style={{ backgroundColor: theme.actionColor, color: theme.onActionColor }}
                      >
                        Asignar usuarios
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Asignaciones activas ── */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-black" style={{ color: theme.textColor }}>Asignaciones activas</h2>
          <p className="mt-0.5 text-sm" style={{ color: theme.subtextColor }}>
            Revisa qué usuarios tienen cada ruta y revoca accesos cuando sea necesario.
          </p>
        </div>

        {assignmentCards.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed px-6 py-12 text-center"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
          >
            <Users className="mx-auto mb-3 h-8 w-8" style={{ color: theme.subtextColor }} />
            <p className="font-bold" style={{ color: theme.textColor }}>Sin asignaciones todavía</p>
            <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>
              Asigna una ruta a tus usuarios desde las tarjetas de arriba.
            </p>
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-2xl border"
            style={{ borderColor: theme.borderColor }}
          >
            {/* Table header */}
            <div
              className="hidden grid-cols-[1fr_1fr_120px_auto] items-center gap-4 border-b px-5 py-3 md:grid"
              style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}
            >
              {['Usuario', 'Ruta', 'Asignado', ''].map((h) => (
                <p key={h} className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: theme.subtextColor }}>
                  {h}
                </p>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y" style={{ backgroundColor: theme.cardBg }}>
              {assignmentCards.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex flex-col gap-3 p-4 md:grid md:grid-cols-[1fr_1fr_120px_auto] md:items-center md:gap-4 md:px-5 md:py-3.5"
                  style={{ borderColor: theme.borderColor }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: theme.textColor }}>
                      {getUserDisplayName(assignment.user) || 'Usuario sin nombre'}
                    </p>
                    <p className="text-xs truncate" style={{ color: theme.subtextColor }}>
                      {assignment.user?.email}
                    </p>
                  </div>

                  <p className="text-sm truncate" style={{ color: theme.textColor }}>
                    {assignment.learning_path?.title ?? assignment.learning_path_id}
                  </p>

                  <p className="text-sm tabular-nums" style={{ color: theme.subtextColor }}>
                    {new Date(assignment.assigned_at).toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>

                  <button
                    type="button"
                    onClick={() => void logic.handleRevokeAssignment(assignment.id)}
                    disabled={logic.revokingAssignmentId === assignment.id}
                    className="inline-flex items-center gap-1.5 self-start rounded-xl border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 md:self-auto"
                    style={{
                      backgroundColor: `${theme.dangerColor}0d`,
                      borderColor: `${theme.dangerColor}25`,
                      color: theme.dangerColor,
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {logic.revokingAssignmentId === assignment.id ? 'Revocando...' : 'Revocar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

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
    </motion.div>
  )
}
