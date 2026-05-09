'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, GitBranch, Route, Sparkles, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import {
  BusinessLearningPathsService,
  type BusinessLearningPath,
  type BusinessLearningPathDefaultRule,
  type BusinessLearningPathHierarchyNode,
} from '../services/businessLearningPaths.service'

interface BusinessLearningPathDefaultModalProps {
  isOpen: boolean
  onClose: () => void
  orgSlug: string
  learningPath: BusinessLearningPath | null
  rules: BusinessLearningPathDefaultRule[]
  hierarchyNodes: BusinessLearningPathHierarchyNode[]
  onChanged: (message?: string) => Promise<void>
}

export function BusinessLearningPathDefaultModal({
  isOpen,
  onClose,
  orgSlug,
  learningPath,
  rules,
  hierarchyNodes,
  onChanged,
}: BusinessLearningPathDefaultModalProps) {
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
  }, [isOpen, learningPath?.id])

  const pathRules = useMemo(
    () => rules.filter((rule) => rule.learning_path_id === learningPath?.id),
    [learningPath?.id, rules],
  )

  async function handleCreateRule() {
    if (!learningPath) return
    if (scopeType === 'node' && !selectedNodeId) {
      setError(t('learningPathsPage.defaults.selectNodeError'))
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      await BusinessLearningPathsService.createDefaultRule(orgSlug, {
        learningPathId: learningPath.id,
        scopeType,
        nodeId: scopeType === 'node' ? selectedNodeId : null,
        includeDescendants,
        applyNow: true,
      })
      await onChanged(t('learningPathsPage.messages.defaultSaved'))
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : t('learningPathsPage.defaults.saveError'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRevokeRule(ruleId: string) {
    try {
      setIsSaving(true)
      setError(null)
      await BusinessLearningPathsService.revokeDefaultRule(orgSlug, ruleId)
      await onChanged(t('learningPathsPage.messages.defaultRevoked'))
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : t('learningPathsPage.defaults.revokeError'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleApplyNow() {
    if (pathRules.length === 0) return

    try {
      setIsApplying(true)
      setError(null)
      await BusinessLearningPathsService.applyDefaultRules(
        orgSlug,
        pathRules.map((rule) => rule.id),
      )
      await onChanged(t('learningPathsPage.messages.defaultApplied'))
    } catch (applyError) {
      setError(
        applyError instanceof Error
          ? applyError.message
          : t('learningPathsPage.defaults.applyError'),
      )
    } finally {
      setIsApplying(false)
    }
  }

  if (!isOpen || !learningPath) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 backdrop-blur-sm"
          style={{ backgroundColor: theme.overlayBg }}
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
                    {t('learningPathsPage.defaults.title')}
                  </p>
                  <h2 className="mt-2 truncate text-2xl font-black" style={{ color: theme.textColor }}>
                    {learningPath.title}
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
                      ? t('learningPathsPage.defaults.scopeOrganization')
                      : t('learningPathsPage.defaults.scopeNode')}
                  </button>
                ))}
              </div>

              {scopeType === 'node' ? (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold" style={{ color: theme.textColor }}>
                    {t('learningPathsPage.defaults.nodeLabel')}
                  </label>
                  <select
                    value={selectedNodeId}
                    onChange={(event) => setSelectedNodeId(event.target.value)}
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                    style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}
                  >
                    <option value="">{t('learningPathsPage.defaults.selectNode')}</option>
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
                    {t('learningPathsPage.defaults.includeDescendants')}
                  </label>
                </div>
              ) : null}

              {error ? (
                <div
                  className="rounded-2xl border px-4 py-3 text-sm"
                  style={{
                    backgroundColor: `${theme.dangerColor}12`,
                    borderColor: `${theme.dangerColor}30`,
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
                  ? t('learningPathsPage.defaults.saving')
                  : t('learningPathsPage.defaults.saveAndApply')}
              </button>
            </div>

            <div className="space-y-4 px-6 py-6 sm:px-8">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-black" style={{ color: theme.textColor }}>
                  {t('learningPathsPage.defaults.activeRules')}
                </h3>
                <button
                  type="button"
                  onClick={() => void handleApplyNow()}
                  disabled={isApplying || pathRules.length === 0}
                  className="rounded-xl border px-3 py-2 text-xs font-black transition disabled:opacity-50"
                  style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}
                >
                  {isApplying
                    ? t('learningPathsPage.defaults.applying')
                    : t('learningPathsPage.defaults.applyNow')}
                </button>
              </div>

              {pathRules.length === 0 ? (
                <div
                  className="rounded-[1.5rem] border border-dashed px-5 py-8 text-center text-sm"
                  style={{ borderColor: theme.borderColor, color: theme.subtextColor }}
                >
                  {t('learningPathsPage.defaults.noRules')}
                </div>
              ) : (
                <div className="space-y-3">
                  {pathRules.map((rule) => (
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
                                ? t('learningPathsPage.defaults.wholeOrganization')
                                : rule.node?.name || t('learningPathsPage.defaults.nodeFallback')}
                            </p>
                            <p className="text-xs" style={{ color: theme.subtextColor }}>
                              {rule.scope_type === 'node' && rule.include_descendants
                                ? t('learningPathsPage.defaults.withDescendants')
                                : t('learningPathsPage.defaults.directScope')}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleRevokeRule(rule.id)}
                          disabled={isSaving}
                          className="rounded-xl border p-2 transition disabled:opacity-50"
                          style={{
                            backgroundColor: `${theme.dangerColor}0d`,
                            borderColor: `${theme.dangerColor}25`,
                            color: theme.dangerColor,
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: theme.subtextColor }}>
                        <CheckCircle2 className="h-4 w-4" style={{ color: theme.successColor }} />
                        {t('learningPathsPage.defaults.autoAssigns')}
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
