'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BusinessCourseDefaultsService,
  type BusinessCourseDefaultRule,
  type BusinessCourseHierarchyNode,
} from '../services/businessCourseDefaults.service'
import { ContentDefaultRulesModal } from './ContentDefaultRulesModal'

interface BusinessCourseDefaultModalProps {
  course: { id: string; title: string } | null
  hierarchyNodes: BusinessCourseHierarchyNode[]
  isOpen: boolean
  onChanged: (message?: string) => Promise<void>
  onClose: () => void
  orgSlug: string
  rules: BusinessCourseDefaultRule[]
}

export function BusinessCourseDefaultModal({
  course,
  hierarchyNodes,
  isOpen,
  onChanged,
  onClose,
  orgSlug,
  rules,
}: BusinessCourseDefaultModalProps) {
  const { t } = useTranslation('business')
  const [isSaving, setIsSaving] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const courseRules = useMemo(() => rules.filter((rule) => rule.course_id === course?.id), [course?.id, rules])

  useEffect(() => {
    if (isOpen) setError(null)
  }, [course?.id, isOpen])

  if (!course) return null

  return (
    <ContentDefaultRulesModal
      error={error}
      hierarchyNodes={hierarchyNodes}
      isApplying={isApplying}
      isOpen={isOpen}
      isSaving={isSaving}
      labels={{
        activeRules: t('assignCourse.defaults.activeRules'),
        applyNow: t('assignCourse.defaults.applyNow'),
        applying: t('assignCourse.defaults.applying'),
        autoAssigns: t('assignCourse.defaults.autoAssigns'),
        directScope: t('assignCourse.defaults.directScope'),
        includeDescendants: t('assignCourse.defaults.includeDescendants'),
        noRules: t('assignCourse.defaults.noRules'),
        nodeFallback: t('assignCourse.defaults.nodeFallback'),
        nodeLabel: t('assignCourse.defaults.nodeLabel'),
        saveAndApply: t('assignCourse.defaults.saveAndApply'),
        saving: t('assignCourse.defaults.saving'),
        scopeNode: t('assignCourse.defaults.scopeNode'),
        scopeOrganization: t('assignCourse.defaults.scopeOrganization'),
        selectNode: t('assignCourse.defaults.selectNode'),
        selectNodeError: t('assignCourse.defaults.selectNodeError'),
        title: t('assignCourse.defaults.title'),
        wholeOrganization: t('assignCourse.defaults.wholeOrganization'),
        withDescendants: t('assignCourse.defaults.withDescendants'),
      }}
      onApply={async () => {
        if (courseRules.length === 0) return
        try {
          setIsApplying(true); setError(null)
          await BusinessCourseDefaultsService.applyDefaultRules(orgSlug, courseRules.map((rule) => rule.id))
          await onChanged(t('assignCourse.messages.defaultApplied'))
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : t('assignCourse.defaults.applyError'))
        } finally { setIsApplying(false) }
      }}
      onClose={onClose}
      onCreate={async ({ includeDescendants, nodeId, scopeType }) => {
        try {
          setIsSaving(true); setError(null)
          await BusinessCourseDefaultsService.createDefaultRule(orgSlug, { applyNow: true, courseId: course.id, includeDescendants, nodeId, scopeType })
          await onChanged(t('assignCourse.messages.defaultSaved'))
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : t('assignCourse.defaults.saveError'))
        } finally { setIsSaving(false) }
      }}
      onRevoke={async (ruleId) => {
        try {
          setIsSaving(true); setError(null)
          await BusinessCourseDefaultsService.revokeDefaultRule(orgSlug, ruleId)
          await onChanged(t('assignCourse.messages.defaultRevoked'))
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : t('assignCourse.defaults.revokeError'))
        } finally { setIsSaving(false) }
      }}
      rules={courseRules}
      title={course.title}
    />
  )
}
