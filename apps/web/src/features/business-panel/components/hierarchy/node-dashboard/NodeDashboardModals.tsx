'use client'

import { BusinessAssignCourseModal } from '../../BusinessAssignCourseModal'
import { CourseAssignmentForm } from '../CourseAssignmentForm'
import { MemberAssignmentModal } from '../MemberAssignmentModal'
import { NodeForm } from '../NodeForm'
import type { NodeDashboardCommonProps } from './node-dashboard.types'

export function NodeDashboardModals({ nodeId, state }: NodeDashboardCommonProps) {
  const node = state.data?.node
  if (!node) return null
  return (
    <>
      <NodeForm isOpen={state.showEditModal} onClose={() => state.setShowEditModal(false)} onSave={state.handleEditSave} mode="edit" nodeToEdit={node} />
      <CourseAssignmentForm isOpen={state.showAssignmentModal} onClose={() => state.setShowAssignmentModal(false)} entityType={state.hierarchyEntityType} entityId={node.id} entityName={node.name} onSuccess={() => { state.setShowAssignmentModal(false); state.fetchData() }} />
      <MemberAssignmentModal isOpen={state.showMemberModal} onClose={() => state.setShowMemberModal(false)} nodeId={nodeId} nodeName={node.name || ''} initialRole={state.initialRole} onSuccess={() => { state.fetchMembers(); state.fetchData() }} />
      {state.selectedCourseForIndividual ? <BusinessAssignCourseModal isOpen={!!state.selectedCourseForIndividual} onClose={() => state.setSelectedCourseForIndividual(null)} courseId={state.selectedCourseForIndividual.id} courseTitle={state.selectedCourseForIndividual.title} orgSlug={state.orgSlug} onAssignComplete={() => undefined} /> : null}
    </>
  )
}
