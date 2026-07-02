'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, GitBranch, Sparkles, Trash2, X } from 'lucide-react'
import {
  AdminContentDefaultsService,
  type AdminContentDefaultRule,
  type AdminHierarchyNode,
  type DefaultScopeType,
} from '@/features/admin/services/adminContentDefaults.service'

export interface ContentDefaultTarget {
  kind: 'course' | 'path'
  id: string
  title: string
}

interface ContentDefaultModalProps {
  isOpen: boolean
  onClose: () => void
  companyId: string
  target: ContentDefaultTarget | null
  rules: AdminContentDefaultRule[]
  nodes: AdminHierarchyNode[]
  onChanged: (message?: string, type?: 'success' | 'error') => void | Promise<void>
}

export function ContentDefaultModal({
  isOpen,
  onClose,
  companyId,
  target,
  rules,
  nodes,
  onChanged,
}: ContentDefaultModalProps) {
  const [scopeType, setScopeType] = useState<DefaultScopeType>('organization')
  const [selectedNodeId, setSelectedNodeId] = useState('')
  const [includeDescendants, setIncludeDescendants] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setScopeType('organization')
    setSelectedNodeId('')
    setIncludeDescendants(true)
    setError(null)
  }, [isOpen, target?.id])

  const targetRules = useMemo(() => {
    if (!target) return []
    return rules.filter((rule) => {
      const ruleTargetId = target.kind === 'course' ? rule.course_id : rule.learning_path_id
      return ruleTargetId === target.id && rule.status === 'active'
    })
  }, [rules, target])

  if (!isOpen || !target) return null

  const isCourse = target.kind === 'course'

  async function runMutation(fn: () => Promise<unknown>, successMsg: string, setBusy: (v: boolean) => void) {
    try {
      setBusy(true)
      setError(null)
      await fn()
      await onChanged(successMsg, 'success')
    } catch (mutationError) {
      const message = mutationError instanceof Error ? mutationError.message : 'Ocurrió un error'
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  function handleCreate() {
    if (!target) return
    if (scopeType === 'node' && !selectedNodeId) {
      setError('Selecciona un nodo de la estructura')
      return
    }
    const payload = {
      scopeType,
      nodeId: scopeType === 'node' ? selectedNodeId : null,
      includeDescendants,
      applyNow: true,
    }
    void runMutation(
      () => isCourse
        ? AdminContentDefaultsService.createCourseDefaultRule(companyId, target.id, payload)
        : AdminContentDefaultsService.createLearningPathDefaultRule(companyId, target.id, payload),
      'Regla predeterminada guardada y aplicada',
      setIsSaving,
    )
  }

  function handleRevoke(ruleId: string) {
    void runMutation(
      () => isCourse
        ? AdminContentDefaultsService.revokeCourseDefaultRule(companyId, ruleId)
        : AdminContentDefaultsService.revokeLearningPathDefaultRule(companyId, ruleId),
      'Regla predeterminada desactivada',
      setIsSaving,
    )
  }

  function handleApplyNow() {
    if (targetRules.length === 0) return
    const ruleIds = targetRules.map((rule) => rule.id)
    void runMutation(
      () => isCourse
        ? AdminContentDefaultsService.applyCourseDefaultRules(companyId, ruleIds)
        : AdminContentDefaultsService.applyLearningPathDefaultRules(companyId, ruleIds),
      'Reglas aplicadas a los usuarios',
      setIsApplying,
    )
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md dark:bg-black/80" />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border shadow-2xl border-gray-200 bg-white dark:border-white/10 dark:bg-carbon-800"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="border-b px-6 py-5 sm:px-8 border-gray-100 dark:border-white/5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-accent/15 dark:text-accent">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-primary dark:text-accent">
                    {isCourse ? 'Curso por defecto' : 'Ruta por defecto'}
                  </p>
                  <h2 className="mt-2 truncate text-2xl font-black text-gray-900 dark:text-white">
                    {target.title}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border p-3 border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-2">
            {/* Left: create rule */}
            <div className="space-y-5 border-b px-6 py-6 sm:px-8 lg:border-b-0 lg:border-r border-gray-100 dark:border-white/5">
              <div className="grid grid-cols-2 gap-3">
                {(['organization', 'node'] as const).map((mode) => {
                  const active = scopeType === mode
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setScopeType(mode)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                        active
                          ? 'border-primary bg-primary/10 text-primary dark:border-accent dark:bg-accent/15 dark:text-accent'
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:bg-carbon-900 dark:text-white/70 dark:hover:bg-white/5'
                      }`}
                    >
                      {mode === 'organization' ? 'Toda la organización' : 'Estructura (nodo)'}
                    </button>
                  )
                })}
              </div>

              {scopeType === 'node' ? (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                    Nodo de la estructura
                  </label>
                  <select
                    value={selectedNodeId}
                    onChange={(event) => setSelectedNodeId(event.target.value)}
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none border-gray-200 bg-gray-50 text-gray-900 dark:border-white/10 dark:bg-carbon-900 dark:text-white"
                  >
                    <option value="">Selecciona un nodo…</option>
                    {nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {`${'  '.repeat(Math.max(0, node.depth))}${node.name} (${node.type})`}
                      </option>
                    ))}
                  </select>
                  {nodes.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-white/60">
                      Esta organización no tiene estructura de jerarquía configurada.
                    </p>
                  ) : null}
                  <label className="flex items-center gap-3 text-sm text-gray-600 dark:text-white/70">
                    <input
                      type="checkbox"
                      checked={includeDescendants}
                      onChange={(event) => setIncludeDescendants(event.target.checked)}
                    />
                    Incluir nodos descendientes
                  </label>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-white/60">
                  {isCourse
                    ? 'El curso se asignará automáticamente a todos los usuarios de la organización.'
                    : 'La ruta se asignará automáticamente a todos los usuarios de la organización.'}
                </p>
              )}

              {error ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-300">
                  {error}
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleCreate}
                disabled={isSaving}
                className="w-full rounded-2xl px-5 py-3 text-sm font-black transition disabled:opacity-50 bg-primary text-white dark:bg-accent dark:text-carbon-900"
              >
                {isSaving ? 'Guardando…' : 'Guardar y aplicar'}
              </button>
            </div>

            {/* Right: active rules */}
            <div className="space-y-4 px-6 py-6 sm:px-8">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-black text-gray-900 dark:text-white">Reglas activas</h3>
                <button
                  type="button"
                  onClick={handleApplyNow}
                  disabled={isApplying || targetRules.length === 0}
                  className="rounded-xl border px-3 py-2 text-xs font-black transition disabled:opacity-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
                >
                  {isApplying ? 'Aplicando…' : 'Aplicar ahora'}
                </button>
              </div>

              {targetRules.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed px-5 py-8 text-center text-sm border-gray-200 text-gray-500 dark:border-white/10 dark:text-white/60">
                  Aún no hay reglas por defecto para este contenido.
                </div>
              ) : (
                <div className="space-y-3">
                  {targetRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="rounded-[1.5rem] border p-4 border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-carbon-900"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-accent/15 dark:text-accent">
                            <GitBranch className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-gray-900 dark:text-white">
                              {rule.scope_type === 'organization'
                                ? 'Toda la organización'
                                : rule.node?.name || 'Nodo de estructura'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-white/60">
                              {rule.scope_type === 'node' && rule.include_descendants
                                ? 'Incluye descendientes'
                                : 'Alcance directo'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRevoke(rule.id)}
                          disabled={isSaving}
                          className="rounded-xl border p-2 transition disabled:opacity-50 border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 dark:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-white/60">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        Se asigna automáticamente a los nuevos usuarios del alcance.
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
