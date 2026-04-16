'use client'

import { motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Route,
  Search,
  Trash2,
  Users,
} from 'lucide-react'

import { BusinessAssignLearningPathModal } from './BusinessAssignLearningPathModal'
import { useBusinessLearningPathsPageLogic } from '../hooks/useBusinessLearningPathsPageLogic'
import type { BusinessUser } from '../services/businessUsers.service'

function getUserDisplayName(user: BusinessUser | null | undefined) {
  if (!user) {
    return ''
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
  return user.display_name || fullName || user.email
}

export function BusinessLearningPathsPage() {
  const logic = useBusinessLearningPathsPageLogic()
  const theme = logic.theme

  const assignmentCards = logic.assignments
    .slice()
    .sort(
      (left, right) =>
        new Date(right.assigned_at).getTime() - new Date(left.assigned_at).getTime(),
    )

  if (logic.isLoading) {
    return (
      <div className="min-h-screen p-6 lg:p-8">
        <div className="mb-8 h-44 animate-pulse rounded-[2rem] bg-white/5" />
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-[1.5rem] bg-white/5" />
          ))}
        </div>
        <div className="mb-8 h-16 animate-pulse rounded-[1.5rem] bg-white/5" />
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-80 animate-pulse rounded-[1.75rem] bg-white/5" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-6 lg:p-8"
    >
      <motion.section
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border p-8 shadow-xl"
        style={{
          background: theme.heroBackground,
          borderColor: theme.heroBorderColor,
        }}
      >
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-72 opacity-50 blur-3xl"
          style={{ backgroundColor: `${theme.accentColor}30` }}
        />

        <div className="relative z-10 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.22em]" style={{ borderColor: theme.inverseBorderColor, color: theme.inverseSubtextColor }}>
            <Route className="h-3.5 w-3.5" />
            <span>
              {logic.t('learningPathsPage.badge', {
                defaultValue: 'Rutas de aprendizaje',
              })}
            </span>
          </div>

          <h1 className="text-3xl font-black text-white lg:text-4xl">
            {logic.t('learningPathsPage.title', {
              defaultValue: 'Rutas de aprendizaje para tu empresa',
            })}
          </h1>
          <p className="mt-3 text-base text-white/80 lg:text-lg">
            {logic.t('learningPathsPage.subtitle', {
              defaultValue:
                'Asigna a tus usuarios las rutas creadas por la plataforma directamente desde el panel de empresa.',
            })}
          </p>
        </div>
      </motion.section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: Route,
            title: logic.t('learningPathsPage.stats.paths', {
              defaultValue: 'Rutas activas',
            }),
            value: logic.learningPaths.length,
          },
          {
            icon: BookOpen,
            title: logic.t('learningPathsPage.stats.workshops', {
              defaultValue: 'Talleres',
            }),
            value: logic.totalWorkshops,
          },
          {
            icon: Users,
            title: logic.t('learningPathsPage.stats.assignedUsers', {
              defaultValue: 'Usuarios con rutas',
            }),
            value: logic.totalAssignedUsers,
          },
          {
            icon: CheckCircle2,
            title: logic.t('learningPathsPage.stats.activeAssignments', {
              defaultValue: 'Asignaciones activas',
            }),
            value: logic.assignments.length,
          },
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-[1.5rem] border p-5"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: theme.subtextColor }}>
                    {stat.title}
                  </p>
                  <p className="mt-3 text-3xl font-black" style={{ color: theme.textColor }}>
                    {stat.value}
                  </p>
                </div>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: theme.actionSurface, color: theme.primaryColor }}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </motion.div>
          )
        })}
      </section>

      {logic.feedback ? (
        <div
          className="mt-6 flex items-start justify-between gap-4 rounded-[1.5rem] border px-5 py-4"
          style={{
            backgroundColor:
              logic.feedback.type === 'success'
                ? `${theme.successColor}12`
                : `${theme.dangerColor}12`,
            borderColor:
              logic.feedback.type === 'success'
                ? `${theme.successColor}28`
                : `${theme.dangerColor}28`,
            color:
              logic.feedback.type === 'success' ? theme.successColor : theme.dangerColor,
          }}
        >
          <p className="text-sm font-semibold">{logic.feedback.message}</p>
          <button
            type="button"
            onClick={() => logic.setFeedback(null)}
            className="text-xs font-black uppercase tracking-[0.2em]"
          >
            OK
          </button>
        </div>
      ) : null}

      {logic.error ? (
        <div
          className="mt-6 rounded-[1.5rem] border px-5 py-4 text-sm"
          style={{
            backgroundColor: `${theme.dangerColor}12`,
            borderColor: `${theme.dangerColor}28`,
            color: theme.dangerColor,
          }}
        >
          {logic.error}
        </div>
      ) : null}

      <section className="mt-8">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: theme.mutedTextColor }}
          />
          <input
            value={logic.searchTerm}
            onChange={(event) => logic.setSearchTerm(event.target.value)}
            placeholder={logic.t('learningPathsPage.searchPlaceholder', {
              defaultValue: 'Buscar por ruta, descripcion o taller...',
            })}
            className="w-full rounded-[1.5rem] border py-4 pl-11 pr-4 text-sm outline-none transition"
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.borderColor,
              color: theme.textColor,
            }}
          />
        </div>
      </section>

      <section className="mt-8">
        {logic.filteredLearningPaths.length === 0 ? (
          <div
            className="rounded-[1.75rem] border border-dashed px-6 py-16 text-center"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
          >
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.25rem]"
              style={{ backgroundColor: theme.actionSurface, color: theme.primaryColor }}
            >
              <Route className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-xl font-black" style={{ color: theme.textColor }}>
              {logic.t('learningPathsPage.empty.title', {
                defaultValue: 'No hay rutas disponibles',
              })}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm" style={{ color: theme.subtextColor }}>
              {logic.t('learningPathsPage.empty.description', {
                defaultValue:
                  'Cuando el equipo administrador cree rutas activas, apareceran aqui para que tu empresa decida a que usuarios asignarlas.',
              })}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {logic.filteredLearningPaths.map((path, index) => {
              const assignedCount = logic.assignmentsByPathId.get(path.id)?.length || 0

              return (
                <motion.article
                  key={path.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex flex-col rounded-[1.75rem] border p-6"
                  style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]"
                          style={{
                            backgroundColor: theme.actionSurface,
                            color: theme.primaryColor,
                          }}
                        >
                          {logic.t('learningPathsPage.cards.sequence', {
                            defaultValue: 'Ruta secuencial',
                          })}
                        </span>
                      </div>

                      <h2 className="mt-4 text-xl font-black" style={{ color: theme.textColor }}>
                        {path.title}
                      </h2>
                      <p className="mt-3 text-sm" style={{ color: theme.subtextColor }}>
                        {path.description ||
                          logic.t('learningPathsPage.cards.noDescription', {
                            defaultValue: 'Sin descripcion disponible.',
                          })}
                      </p>
                    </div>

                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: theme.actionSurface, color: theme.primaryColor }}
                    >
                      <Route className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div
                      className="rounded-2xl border p-4"
                      style={{
                        backgroundColor: theme.inputBg,
                        borderColor: theme.borderColor,
                      }}
                    >
                      <p className="text-xs font-semibold" style={{ color: theme.subtextColor }}>
                        {logic.t('learningPathsPage.cards.workshopsCountLabel', {
                          defaultValue: 'Talleres',
                        })}
                      </p>
                      <p className="mt-2 text-2xl font-black" style={{ color: theme.textColor }}>
                        {path.item_count}
                      </p>
                    </div>

                    <div
                      className="rounded-2xl border p-4"
                      style={{
                        backgroundColor: theme.inputBg,
                        borderColor: theme.borderColor,
                      }}
                    >
                      <p className="text-xs font-semibold" style={{ color: theme.subtextColor }}>
                        {logic.t('learningPathsPage.cards.assignedUsersLabel', {
                          defaultValue: 'Usuarios',
                        })}
                      </p>
                      <p className="mt-2 text-2xl font-black" style={{ color: theme.textColor }}>
                        {assignedCount}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p
                      className="text-xs font-black uppercase tracking-[0.22em]"
                      style={{ color: theme.accentColor }}
                    >
                      {logic.t('learningPathsPage.cards.sequencePreview', {
                        defaultValue: 'Vista previa',
                      })}
                    </p>
                    <div className="mt-4 space-y-3">
                      {path.items.slice(0, 4).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 rounded-2xl border p-3"
                          style={{
                            backgroundColor: theme.inputBg,
                            borderColor: theme.borderColor,
                          }}
                        >
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black"
                            style={{
                              backgroundColor: theme.actionSurface,
                              color: theme.primaryColor,
                            }}
                          >
                            {item.position}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold" style={{ color: theme.textColor }}>
                              {item.course?.title ||
                                logic.t('learningPathsPage.cards.noCourseTitle', {
                                  defaultValue: 'Taller sin titulo',
                                })}
                            </p>
                            <p className="text-xs" style={{ color: theme.subtextColor }}>
                              {item.course?.level ||
                                logic.t('learningPathsPage.cards.noLevel', {
                                  defaultValue: 'Sin nivel',
                                })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3 border-t pt-5" style={{ borderColor: theme.borderColor }}>
                    <p className="text-sm" style={{ color: theme.subtextColor }}>
                      {logic.t('learningPathsPage.cards.assignedUsers', {
                        defaultValue: '{{count}} usuarios asignados',
                        count: assignedCount,
                      })}
                    </p>

                    <button
                      type="button"
                      onClick={() => logic.setSelectedLearningPathId(path.id)}
                      className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition"
                      style={{
                        backgroundColor: theme.primaryColor,
                        color: theme.onPrimaryColor,
                      }}
                    >
                      <span>
                        {logic.t('learningPathsPage.cards.assignUsers', {
                          defaultValue: 'Asignar usuarios',
                        })}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.article>
              )
            })}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-5">
          <h2 className="text-2xl font-black" style={{ color: theme.textColor }}>
            {logic.t('learningPathsPage.assignmentsTitle', {
              defaultValue: 'Asignaciones activas',
            })}
          </h2>
          <p className="mt-2 text-sm" style={{ color: theme.subtextColor }}>
            {logic.t('learningPathsPage.assignmentsDescription', {
              defaultValue:
                'Aqui puedes revisar que usuarios tienen cada ruta y revocar accesos individuales cuando sea necesario.',
            })}
          </p>
        </div>

        {assignmentCards.length === 0 ? (
          <div
            className="rounded-[1.75rem] border border-dashed px-6 py-14 text-center"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
          >
            <Users className="mx-auto h-10 w-10" style={{ color: theme.mutedTextColor }} />
            <p className="mt-4 text-lg font-black" style={{ color: theme.textColor }}>
              {logic.t('learningPathsPage.noAssignmentsTitle', {
                defaultValue: 'Todavia no hay asignaciones',
              })}
            </p>
            <p className="mt-2 text-sm" style={{ color: theme.subtextColor }}>
              {logic.t('learningPathsPage.noAssignmentsDescription', {
                defaultValue:
                  'Selecciona una ruta y asignala a los usuarios que deban seguirla desde este panel.',
              })}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {assignmentCards.map((assignment) => (
              <div
                key={assignment.id}
                className="flex flex-col gap-4 rounded-[1.5rem] border p-5 lg:flex-row lg:items-center lg:justify-between"
                style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
              >
                <div className="grid flex-1 gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: theme.accentColor }}>
                      {logic.t('learningPathsPage.columns.user', {
                        defaultValue: 'Usuario',
                      })}
                    </p>
                    <p className="mt-2 text-sm font-semibold" style={{ color: theme.textColor }}>
                      {getUserDisplayName(assignment.user) ||
                        logic.t('learningPathsPage.unnamedUser', {
                          defaultValue: 'Usuario sin nombre',
                        })}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: theme.subtextColor }}>
                      {assignment.user?.email}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: theme.accentColor }}>
                      {logic.t('learningPathsPage.columns.learningPath', {
                        defaultValue: 'Ruta',
                      })}
                    </p>
                    <p className="mt-2 text-sm font-semibold" style={{ color: theme.textColor }}>
                      {assignment.learning_path?.title || assignment.learning_path_id}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: theme.accentColor }}>
                      {logic.t('learningPathsPage.columns.assignedAt', {
                        defaultValue: 'Asignado',
                      })}
                    </p>
                    <p className="mt-2 text-sm font-semibold" style={{ color: theme.textColor }}>
                      {new Date(assignment.assigned_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void logic.handleRevokeAssignment(assignment.id)}
                  disabled={logic.revokingAssignmentId === assignment.id}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    backgroundColor: `${theme.dangerColor}10`,
                    borderColor: `${theme.dangerColor}25`,
                    color: theme.dangerColor,
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>
                    {logic.revokingAssignmentId === assignment.id
                      ? logic.t('learningPathsPage.revoking', {
                          defaultValue: 'Revocando...',
                        })
                      : logic.t('learningPathsPage.revoke', {
                          defaultValue: 'Revocar',
                        })}
                  </span>
                </button>
              </div>
            ))}
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
