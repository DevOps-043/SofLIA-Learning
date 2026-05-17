import { BusinessAssignLearningPathModal } from '../BusinessAssignLearningPathModal'
import { BusinessLearningPathDefaultModal } from '../BusinessLearningPathDefaultModal'
import { BusinessLearningPathVideosModal } from '../BusinessLearningPathVideosModal'
import type { BusinessLearningPathItem, BusinessLearningPathsLogic } from './types'

interface BusinessLearningPathModalsProps {
  logic: BusinessLearningPathsLogic
  videosLearningPathId: string | null
  selectedLearningPathForVideos: BusinessLearningPathItem | null
  onCloseVideos: () => void
}

export function BusinessLearningPathModals({
  logic,
  videosLearningPathId,
  selectedLearningPathForVideos,
  onCloseVideos,
}: BusinessLearningPathModalsProps) {
  return (
    <>
      <BusinessAssignLearningPathModal
        isOpen={Boolean(logic.selectedLearningPath)}
        onClose={() => logic.setSelectedLearningPathId(null)}
        orgSlug={logic.orgSlug}
        learningPath={logic.selectedLearningPath}
        users={logic.users}
        isLoadingUsers={logic.loadingUsers}
        existingAssignments={logic.selectedPathAssignments}
        hierarchyNodes={logic.hierarchyNodes}
        onAssigned={logic.handleAssignmentCreated}
      />
      <BusinessLearningPathDefaultModal
        isOpen={Boolean(logic.defaultConfigLearningPath)}
        onClose={() => logic.setDefaultConfigLearningPathId(null)}
        orgSlug={logic.orgSlug}
        learningPath={logic.defaultConfigLearningPath}
        rules={logic.defaultRules}
        hierarchyNodes={logic.hierarchyNodes}
        onChanged={logic.handleDefaultRulesChanged}
      />
      <BusinessLearningPathVideosModal
        isOpen={Boolean(videosLearningPathId)}
        onClose={onCloseVideos}
        orgSlug={logic.orgSlug}
        learningPath={selectedLearningPathForVideos}
      />
    </>
  )
}
