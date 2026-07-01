'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, GitBranch, Route, Sparkles, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import {
  BusinessCourseDefaultsService,
  type BusinessCourseDefaultRule,
  type BusinessCourseHierarchyNode,
} from '../services/businessCourseDefaults.service'

interface BusinessCourseDefaultModalProps {
  isOpen: boolean
  onClose: () => void
  orgSlug: string
  course: { id: string; title: string } | null
  rules: BusinessCourseDefaultRule[]
  hierarchyNodes: BusinessCourseHierarchyNode[]
  onChanged: (message?: string) => Promise<void>
}

export function BusinessCourseDefaultModal({
  isOpen,
  onClose,
  orgSlug,
  course,
  rules,
  hierarchyNodes,
  onChanged,
}: BusinessCourseDefaultModalProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const [scopeType, setScopeType] = useState<'organization' | 'node'>('organization')
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
  }, [isOpen, course?.id])

  const courseRules = useMemo(
    () => rules.filter((rule) => rule.course_id === course?.id),
    [course?.id, rules],
  )

  async function handleCreateRule() {
    if (!course) return
    if (scopeType === 'node' && !selectedNodeId) {
      setError(t('assignCourse.defaults.selectNodeError'))
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      await BusinessCourseDefaultsService.createDefaultRule(orgSlug, {
        courseId: course.id,
        scopeType,
        nodeId: scopeType === 'node' ? selectedNodeId : null,
        includeDescendants,
        applyNow: true,
      })
      await onChanged(t('assignCourse.messages.defaultSaved'))
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : t('assignCourse.defaults.saveError'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRevokeRule(ruleId: string) {
    try {
      setIsSaving(true)
      setError(null)
      await BusinessCourseDefaultsService.revokeDefaultRule(orgSlug, ruleId)
      await onChanged(t('assignCourse.messages.defaultRevoked'))
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : t('assignCourse.defaults.revokeError'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleApplyNow() {
    if (courseRules.length === 0) return

    try {
      setIsApplying(true)
      setError(null)
      await BusinessCourseDefaultsService.applyDefaultRules(
        orgSlug,
        courseRules.map((rule) => rule.id),
      )
      await onChanged(t('assignCourse.messages.defaultApplied'))
    } catch (applyError) {
      setError(
        applyError instanceof Error
          ? applyError.message
          : t('assignCourse.defaults.applyError'),
      )
    } finally {
      setIsApplying(false)
    }
  }

  if (!isOpen || !course) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border shadow-2xl"
          style={{ backgroundColor: theme.panelBg, borderColor: theme.borderColor }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="border-b px-6 py-5 sm:px-8" style={{ borderColor: theme.borderColor }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                    color: theme.onPrimaryColor,
                  }}
                >
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: theme.accentColor }}>
                    {t('assignCourse.defaults.title')}
                  </p>
                  <h2 className="mt-2 truncate text-2xl font-black" style={{ color: theme.textColor }}>
                    {course.title}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border p-3"
                style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[1fr,1fr]">
            <div className="space-y-5 border-r px-6 py-6 sm:px-8" style={{ borderColor: theme.borderColor }}>
              <div className="grid grid-cols-2 gap-3">
                {(['organization', 'node'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setScopeType(mode)}
                    className="rounded-2xl border px-4 py-3 text-sm font-black transition"
                    style={{
                      backgroundColor: scopeType === mode ? theme.actionSurface : theme.inputBg,
                      borderColor: scopeType === mode ? theme.primaryColor : theme.borderColor,
                      color: theme.textColor,
                    }}
                  >
                    {mode === 'organization'
                      ? t('assignCourse.defaults.scopeOrganization')
                      : t('assignCourse.defaults.scopeNode')}
                  </button>
                ))}
              </div>

              {scopeType === 'node' ? (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold" style={{ color: theme.textColor }}>
                    {t('assignCourse.defaults.nodeLabel')}
                  </label>
                  <select
                    value={selectedNodeId}
                    onChange={(event) => setSelectedNodeId(event.target.value)}
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                    style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}
                  >
                    <option value="">{t('assignCourse.defaults.selectNode')}</option>
                    {hierarchyNodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {`${'  '.repeat(Math.max(0, node.depth))}${node.name} (${node.type})`}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-3 text-sm" style={{ color: theme.subtextColor }}>
                    <input
                      type="checkbox"
                      checked={includeDescendants}
                      onChange={(event) => setIncludeDescendants(event.target.checked)}
                    />
                    {t('assignCourse.defaults.includeDescendants')}
                  </label>
                </div>
              ) : null}

              {error ? (
                <div
                  className="rounded-2xl border px-4 py-3 text-sm"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${theme.dangerColor} 7.1%, transparent)`,
                    borderColor: `color-mix(in srgb, ${theme.dangerColor} 18.8%, transparent)`,
                    color: theme.dangerColor,
                  }}
                >
                  {error}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => void handleCreateRule()}
                disabled={isSaving}
                className="w-full rounded-2xl px-5 py-3 text-sm font-black transition disabled:opacity-50"
                style={{ backgroundColor: theme.primaryColor, color: theme.onPrimaryColor }}
              >
                {isSaving
                  ? t('assignCourse.defaults.saving')
                  : t('assignCourse.defaults.saveAndApply')}
              </button>
            </div>

            <div className="space-y-4 px-6 py-6 sm:px-8">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-black" style={{ color: theme.textColor }}>
                  {t('assignCourse.defaults.activeRules')}
                </h3>
                <button
                  type="button"
                  onClick={() => void handleApplyNow()}
                  disabled={isApplying || courseRules.length === 0}
                  className="rounded-xl border px-3 py-2 text-xs font-black transition disabled:opacity-50"
                  style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}
                >
                  {isApplying
                    ? t('assignCourse.defaults.applying')
                    : t('assignCourse.defaults.applyNow')}
                </button>
              </div>

              {courseRules.length === 0 ? (
                <div
                  className="rounded-[1.5rem] border border-dashed px-5 py-8 text-center text-sm"
                  style={{ borderColor: theme.borderColor, color: theme.subtextColor }}
                >
                  {t('assignCourse.defaults.noRules')}
                </div>
              ) : (
                <div className="space-y-3">
                  {courseRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="rounded-[1.5rem] border p-4"
                      style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 gap-3">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                            style={{ backgroundColor: theme.actionSurface, color: theme.primaryColor }}
                          >
                            {rule.scope_type === 'organization' ? <Route className="h-5 w-5" /> : <GitBranch className="h-5 w-5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black" style={{ color: theme.textColor }}>
                              {rule.scope_type === 'organization'
                                ? t('assignCourse.defaults.wholeOrganization')
                                : rule.node?.name || t('assignCourse.defaults.nodeFallback')}
                            </p>
                            <p className="text-xs" style={{ color: theme.subtextColor }}>
                              {rule.scope_type === 'node' && rule.include_descendants
                                ? t('assignCourse.defaults.withDescendants')
                                : t('assignCourse.defaults.directScope')}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleRevokeRule(rule.id)}
                          disabled={isSaving}
                          className="rounded-xl border p-2 transition disabled:opacity-50"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${theme.dangerColor} 5.1%, transparent)`,
                            borderColor: `color-mix(in srgb, ${theme.dangerColor} 14.5%, transparent)`,
                            color: theme.dangerColor,
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: theme.subtextColor }}>
                        <CheckCircle2 className="h-4 w-4" style={{ color: theme.successColor }} />
                        {t('assignCourse.defaults.autoAssigns')}
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
