import type { TFunction } from 'i18next'
import type { useBusinessLearningPathsPageLogic } from '../../hooks/useBusinessLearningPathsPageLogic'

export type BusinessLearningPathsLogic = ReturnType<typeof useBusinessLearningPathsPageLogic>
export type BusinessLearningPathItem = BusinessLearningPathsLogic['filteredLearningPaths'][number]
export type BusinessLearningPathAssignment = BusinessLearningPathsLogic['assignments'][number]
export type BusinessLearningPathsTheme = BusinessLearningPathsLogic['theme']
export type BusinessLearningPathsTranslate = TFunction<'business'>
