'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BusinessLearningPathsService,
  type BusinessLearningPath,
  type BusinessLearningPathDefaultRule,
  type BusinessLearningPathHierarchyNode,
} from '../services/businessLearningPaths.service'
import { ContentDefaultRulesModal } from './ContentDefaultRulesModal'

interface BusinessLearningPathDefaultModalProps {
  hierarchyNodes: BusinessLearningPathHierarchyNode[]
  isOpen: boolean
  learningPath: BusinessLearningPath | null
  onChanged: (message?: string) => Promise<void>
  onClose: () => void
  orgSlug: string
  rules: BusinessLearningPathDefaultRule[]
}

export function BusinessLearningPathDefaultModal({
  hierarchyNodes,
  isOpen,
  learningPath,
  onChanged,
  onClose,
  orgSlug,
  rules,
}: BusinessLearningPathDefaultModalProps) {
  const { t } = useTranslation('business')
  const [isSaving, setIsSaving] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pathRules = useMemo(
    () => rules.filter((rule) => rule.learning_path_id === learningPath?.id),
    [learningPath?.id, rules],
  )

  useEffect(() => {
    if (isOpen) setError(null)
  }, [isOpen, learningPath?.id])

  if (!learningPath) return null

  return (
    <ContentDefaultRulesModal
      error={error}
      hierarchyNodes={hierarchyNodes}
      isApplying={isApplying}
      isOpen={isOpen}
      isSaving={isSaving}
      labels={{
        activeRules: t('learningPathsPage.defaults.activeRules'),
        applyNow: t('learningPathsPage.defaults.applyNow'),
        applying: t('learningPathsPage.defaults.applying'),
        autoAssigns: t('learningPathsPage.defaults.autoAssigns'),
        directScope: t('learningPathsPage.defaults.directScope'),
        includeDescendants: t('learningPathsPage.defaults.includeDescendants'),
        noRules: t('learningPathsPage.defaults.noRules'),
        nodeFallback: t('learningPathsPage.defaults.nodeFallback'),
        nodeLabel: t('learningPathsPage.defaults.nodeLabel'),
        saveAndApply: t('learningPathsPage.defaults.saveAndApply'),
        saving: t('learningPathsPage.defaults.saving'),
        scopeNode: t('learningPathsPage.defaults.scopeNode'),
        scopeOrganization: t('learningPathsPage.defaults.scopeOrganization'),
        selectNode: t('learningPathsPage.defaults.selectNode'),
        selectNodeError: t('learningPathsPage.defaults.selectNodeError'),
        title: t('learningPathsPage.defaults.title'),
        wholeOrganization: t('learningPathsPage.defaults.wholeOrganization'),
        withDescendants: t('learningPathsPage.defaults.withDescendants'),
      }}
      onApply={async () => {
        if (pathRules.length === 0) return
        try {
          setIsApplying(true); setError(null)
          await BusinessLearningPathsService.applyDefaultRules(orgSlug, pathRules.map((rule) => rule.id))
          await onChanged(t('learningPathsPage.messages.defaultApplied'))
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : t('learningPathsPage.defaults.applyError'))
        } finally { setIsApplying(false) }
      }}
      onClose={onClose}
      onCreate={async ({ includeDescendants, nodeId, scopeType }) => {
        try {
          setIsSaving(true); setError(null)
          await BusinessLearningPathsService.createDefaultRule(orgSlug, {
            applyNow: true,
            includeDescendants,
            learningPathId: learningPath.id,
            nodeId,
            scopeType,
          })
          await onChanged(t('learningPathsPage.messages.defaultSaved'))
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : t('learningPathsPage.defaults.saveError'))
        } finally { setIsSaving(false) }
      }}
      onRevoke={async (ruleId) => {
        try {
          setIsSaving(true); setError(null)
          await BusinessLearningPathsService.revokeDefaultRule(orgSlug, ruleId)
          await onChanged(t('learningPathsPage.messages.defaultRevoked'))
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : t('learningPathsPage.defaults.revokeError'))
        } finally { setIsSaving(false) }
      }}
      rules={pathRules}
      title={learningPath.title}
    />
  )
}
