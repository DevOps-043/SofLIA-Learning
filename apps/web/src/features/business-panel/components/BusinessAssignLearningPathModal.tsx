'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Route, Search, Users, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import type { BusinessUser } from '../services/businessUsers.service'
import {
  BusinessLearningPathsService,
  type BusinessLearningPath,
  type BusinessLearningPathAssignment,
} from '../services/businessLearningPaths.service'

interface BusinessAssignLearningPathModalProps {
  isOpen: boolean
  onClose: () => void
  orgSlug: string
  learningPath: BusinessLearningPath | null
  users: BusinessUser[]
  isLoadingUsers: boolean
  existingAssignments: BusinessLearningPathAssignment[]
  onAssigned: () => Promise<void>
}

function getUserDisplayName(user: BusinessUser) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
  return user.display_name || fullName || user.email
}

export function BusinessAssignLearningPathModal({
  isOpen,
  onClose,
  orgSlug,
  learningPath,
  users,
  isLoadingUsers,
  existingAssignments,
  onAssigned,
}: BusinessAssignLearningPathModalProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSearchTerm('')
    setSelectedUserIds(new Set())
    setError(null)
  }, [isOpen, learningPath?.id])

  const activeUsers = useMemo(
    () => users.filter((user) => user.org_status === 'active'),
    [users],
  )

  const alreadyAssignedUserIds = useMemo(
    () => new Set(existingAssignments.map((assignment) => assignment.user_id)),
    [existingAssignments],
  )

  const normalizedSearchTerm = searchTerm.trim().toLowerCase()

  const filteredUsers = useMemo(() => {
    return activeUsers.filter((user) => {
      if (!normalizedSearchTerm) {
        return true
      }

      const displayName = getUserDisplayName(user).toLowerCase()
      return (
        displayName.includes(normalizedSearchTerm) ||
        user.email.toLowerCase().includes(normalizedSearchTerm)
      )
    })
  }, [activeUsers, normalizedSearchTerm])

  const selectableUserIds = useMemo(
    () =>
      filteredUsers
        .filter((user) => !alreadyAssignedUserIds.has(user.id))
        .map((user) => user.id),
    [alreadyAssignedUserIds, filteredUsers],
  )

  const allUsersSelected =
    selectableUserIds.length > 0 &&
    selectableUserIds.every((userId) => selectedUserIds.has(userId))

  function handleToggleUser(userId: string) {
    setSelectedUserIds((current) => {
      const next = new Set(current)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  function handleToggleAllUsers() {
    setSelectedUserIds((current) => {
      const next = new Set(current)

      if (allUsersSelected) {
        selectableUserIds.forEach((userId) => next.delete(userId))
        return next
      }

      selectableUserIds.forEach((userId) => next.add(userId))
      return next
    })
  }

  async function handleAssign() {
    if (!learningPath) {
      return
    }

    if (selectedUserIds.size === 0) {
      setError(
        t('assignLearningPath.selectUserError', {
          defaultValue: 'Selecciona al menos un usuario para asignar la ruta.',
        }),
      )
      return
    }

    try {
      setIsAssigning(true)
      setError(null)

      await BusinessLearningPathsService.assignLearningPath(
        orgSlug,
        learningPath.id,
        Array.from(selectedUserIds),
      )

      await onAssigned()
      onClose()
    } catch (assignmentError) {
      setError(
        assignmentError instanceof Error
          ? assignmentError.message
          : t('assignLearningPath.assignError', {
              defaultValue: 'No se pudo asignar la ruta de aprendizaje.',
            }),
      )
    } finally {
      setIsAssigning(false)
    }
  }

  if (!isOpen || !learningPath) {
    return null
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 backdrop-blur-sm"
          style={{ backgroundColor: theme.overlayBg }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border shadow-2xl"
          style={{ backgroundColor: theme.panelBg, borderColor: theme.borderColor }}
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className="border-b px-6 py-5 sm:px-8"
            style={{ borderColor: theme.borderColor }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem]"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                    color: theme.onPrimaryColor,
                  }}
                >
                  <Route className="h-7 w-7" />
                </div>

                <div className="min-w-0">
                  <p
                    className="text-xs font-black uppercase tracking-[0.24em]"
                    style={{ color: theme.accentColor }}
                  >
                    {t('assignLearningPath.title', {
                      defaultValue: 'Asignar ruta de aprendizaje',
                    })}
                  </p>
                  <h2
                    className="mt-2 truncate text-2xl font-black"
                    style={{ color: theme.textColor }}
                  >
                    {learningPath.title}
                  </h2>
                  <p
                    className="mt-2 max-w-2xl text-sm"
                    style={{ color: theme.subtextColor }}
                  >
                    {t('assignLearningPath.subtitle', {
                      defaultValue:
                        'Selecciona que usuarios activos de tu empresa recibiran esta ruta.',
                    })}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border p-3 transition-colors"
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.borderColor,
                  color: theme.textColor,
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-[1.35fr,0.85fr]">
            <div className="flex min-h-0 flex-col border-r" style={{ borderColor: theme.borderColor }}>
              <div className="border-b px-6 py-5 sm:px-8" style={{ borderColor: theme.borderColor }}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative flex-1">
                    <Search
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                      style={{ color: theme.mutedTextColor }}
                    />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder={t('assignLearningPath.searchPlaceholder', {
                        defaultValue: 'Buscar por nombre o email...',
                      })}
                      className="w-full rounded-2xl border py-3 pl-11 pr-4 text-sm outline-none transition"
                      style={{
                        backgroundColor: theme.inputBg,
                        borderColor: theme.borderColor,
                        color: theme.textColor,
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleAllUsers}
                    disabled={selectableUserIds.length === 0}
                    className="rounded-2xl border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      backgroundColor: allUsersSelected ? theme.actionSurface : theme.inputBg,
                      borderColor: allUsersSelected ? theme.primaryColor : theme.borderColor,
                      color: theme.textColor,
                    }}
                  >
                    {allUsersSelected
                      ? t('assignLearningPath.clearSelection', {
                          defaultValue: 'Limpiar seleccion',
                        })
                      : t('assignLearningPath.selectAll', {
                          defaultValue: 'Seleccionar visibles',
                        })}
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-xs" style={{ color: theme.subtextColor }}>
                  <span>
                    {t('assignLearningPath.selectedCount', {
                      defaultValue: '{{count}} usuarios seleccionados',
                      count: selectedUserIds.size,
                    })}
                  </span>
                  <span>
                    {t('assignLearningPath.availableCount', {
                      defaultValue: '{{count}} usuarios activos disponibles',
                      count: activeUsers.filter((user) => !alreadyAssignedUserIds.has(user.id)).length,
                    })}
                  </span>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8">
                {error ? (
                  <div
                    className="mb-4 rounded-2xl border px-4 py-3 text-sm"
                    style={{
                      backgroundColor: `${theme.dangerColor}12`,
                      borderColor: `${theme.dangerColor}30`,
                      color: theme.dangerColor,
                    }}
                  >
                    {error}
                  </div>
                ) : null}

                {isLoadingUsers ? (
                  <div
                    className="rounded-3xl border border-dashed px-6 py-12 text-center text-sm"
                    style={{ borderColor: theme.borderColor, color: theme.subtextColor }}
                  >
                    {t('assignLearningPath.loading', {
                      defaultValue: 'Cargando usuarios...',
                    })}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div
                    className="rounded-3xl border border-dashed px-6 py-12 text-center text-sm"
                    style={{ borderColor: theme.borderColor, color: theme.subtextColor }}
                  >
                    {t('assignLearningPath.noUsers', {
                      defaultValue: 'No hay usuarios disponibles para esta ruta.',
                    })}
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {filteredUsers.map((user) => {
                      const isSelected = selectedUserIds.has(user.id)
                      const isAlreadyAssigned = alreadyAssignedUserIds.has(user.id)
                      const displayName = getUserDisplayName(user)

                      return (
                        <button
                          key={user.id}
                          type="button"
                          disabled={isAlreadyAssigned}
                          onClick={() => handleToggleUser(user.id)}
                          className="rounded-[1.5rem] border p-4 text-left transition disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: isSelected ? theme.actionSurface : theme.cardBg,
                            borderColor: isSelected ? theme.primaryColor : theme.borderColor,
                            opacity: isAlreadyAssigned ? 0.55 : 1,
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black"
                              style={{
                                backgroundColor: isSelected ? theme.primaryColor : theme.inputBg,
                                color: isSelected ? theme.onPrimaryColor : theme.textColor,
                              }}
                            >
                              {displayName.slice(0, 1).toUpperCase()}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p
                                    className="truncate text-sm font-semibold"
                                    style={{ color: theme.textColor }}
                                  >
                                    {displayName}
                                  </p>
                                  <p
                                    className="truncate text-xs"
                                    style={{ color: theme.subtextColor }}
                                  >
                                    {user.email}
                                  </p>
                                </div>

                                {isSelected ? (
                                  <div
                                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                                    style={{
                                      backgroundColor: theme.primaryColor,
                                      color: theme.onPrimaryColor,
                                    }}
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </div>
                                ) : null}
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                {isAlreadyAssigned ? (
                                  <span
                                    className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em]"
                                    style={{
                                      backgroundColor: theme.hoverBg,
                                      color: theme.subtextColor,
                                    }}
                                  >
                                    {t('assignLearningPath.alreadyAssigned', {
                                      defaultValue: 'Ya asignado',
                                    })}
                                  </span>
                                ) : null}
                                {user.job_title ? (
                                  <span
                                    className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em]"
                                    style={{
                                      backgroundColor: theme.hoverBg,
                                      color: theme.subtextColor,
                                    }}
                                  >
                                    {user.job_title}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="min-h-0 overflow-y-auto px-6 py-5 sm:px-8">
              <div
                className="rounded-[1.75rem] border p-5"
                style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: theme.actionSurface, color: theme.primaryColor }}
                  >
                    <Users className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p
                      className="text-xs font-black uppercase tracking-[0.24em]"
                      style={{ color: theme.accentColor }}
                    >
                      {t('assignLearningPath.previewTitle', {
                        defaultValue: 'Resumen de la ruta',
                      })}
                    </p>
                    <h3
                      className="mt-2 text-lg font-black"
                      style={{ color: theme.textColor }}
                    >
                      {learningPath.title}
                    </h3>
                    <p className="mt-2 text-sm" style={{ color: theme.subtextColor }}>
                      {learningPath.description ||
                        t('learningPathsPage.cards.noDescription', {
                          defaultValue: 'Sin descripcion disponible.',
                        })}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div
                    className="rounded-2xl border p-4"
                    style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}
                  >
                    <p className="text-xs font-semibold" style={{ color: theme.subtextColor }}>
                      {t('learningPathsPage.stats.workshops', {
                        defaultValue: 'Talleres',
                      })}
                    </p>
                    <p className="mt-2 text-2xl font-black" style={{ color: theme.textColor }}>
                      {learningPath.item_count}
                    </p>
                  </div>

                  <div
                    className="rounded-2xl border p-4"
                    style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}
                  >
                    <p className="text-xs font-semibold" style={{ color: theme.subtextColor }}>
                      {t('learningPathsPage.stats.activeAssignments', {
                        defaultValue: 'Asignaciones',
                      })}
                    </p>
                    <p className="mt-2 text-2xl font-black" style={{ color: theme.textColor }}>
                      {existingAssignments.length}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <p
                    className="text-xs font-black uppercase tracking-[0.22em]"
                    style={{ color: theme.accentColor }}
                  >
                    {t('learningPathsPage.cards.sequence', {
                      defaultValue: 'Secuencia',
                    })}
                  </p>
                  <div className="mt-4 space-y-3">
                    {learningPath.items.slice(0, 5).map((item) => (
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
                              t('learningPathsPage.cards.noCourseTitle', {
                                defaultValue: 'Taller sin titulo',
                              })}
                          </p>
                          <p className="text-xs" style={{ color: theme.subtextColor }}>
                            {item.course?.category ||
                              t('learningPathsPage.cards.noCategory', {
                                defaultValue: 'Sin categoria',
                              })}
                          </p>
                        </div>
                      </div>
                    ))}

                    {learningPath.items.length > 5 ? (
                      <p className="text-xs" style={{ color: theme.subtextColor }}>
                        {t('assignLearningPath.moreItems', {
                          defaultValue: 'Y {{count}} talleres mas en la ruta.',
                          count: learningPath.items.length - 5,
                        })}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8"
            style={{ borderColor: theme.borderColor }}
          >
            <p className="text-sm" style={{ color: theme.subtextColor }}>
              {t('assignLearningPath.footerNote', {
                defaultValue: 'Las asignaciones se aplicaran solo a usuarios activos de esta empresa.',
              })}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border px-5 py-3 text-sm font-semibold transition"
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.borderColor,
                  color: theme.textColor,
                }}
              >
                {t('assignLearningPath.cancel', {
                  defaultValue: 'Cancelar',
                })}
              </button>

              <button
                type="button"
                onClick={() => void handleAssign()}
                disabled={isAssigning || selectedUserIds.size === 0}
                className="rounded-2xl px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor: theme.primaryColor,
                  color: theme.onPrimaryColor,
                }}
              >
                {isAssigning
                  ? t('assignLearningPath.assigning', {
                      defaultValue: 'Asignando...',
                    })
                  : t('assignLearningPath.confirm', {
                      defaultValue: 'Asignar ruta ({{count}})',
                      count: selectedUserIds.size,
                    })}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
