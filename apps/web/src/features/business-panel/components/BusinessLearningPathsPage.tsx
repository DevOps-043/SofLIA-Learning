'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

import { useBusinessLearningPathsPageLogic } from '../hooks/useBusinessLearningPathsPageLogic'
import { useTour } from '@/features/tours'
import { businessPanelLearningPathsTour } from '@/features/tours/config/business-panel-learning-paths.tour'
import { BusinessLearningPathAssignments } from './BusinessLearningPathsPage/Assignments'
import { BusinessLearningPathCards } from './BusinessLearningPathsPage/Cards'
import { BusinessLearningPathsFeedback } from './BusinessLearningPathsPage/Feedback'
import { BusinessLearningPathsHero } from './BusinessLearningPathsPage/Hero'
import { BusinessLearningPathsLoading } from './BusinessLearningPathsPage/LoadingState'
import { BusinessLearningPathModals } from './BusinessLearningPathsPage/Modals'
import { BusinessLearningPathsSearch } from './BusinessLearningPathsPage/Search'
import { BusinessLearningPathStats } from './BusinessLearningPathsPage/Stats'

export function BusinessLearningPathsPage() {
  const { t, i18n } = useTranslation('business')
  const logic = useBusinessLearningPathsPageLogic()
  const [videosLearningPathId, setVideosLearningPathId] = useState<string | null>(null)
  const { autoStartIfNeeded } = useTour(businessPanelLearningPathsTour)

  useEffect(() => {
    return autoStartIfNeeded()
  }, [autoStartIfNeeded])
  const selectedLearningPathForVideos = useMemo(
    () => logic.learningPaths.find((path) => path.id === videosLearningPathId) ?? null,
    [logic.learningPaths, videosLearningPathId],
  )
  const { panelBg, borderColor, inputBg } = logic.theme

  if (logic.isLoading) {
    return <BusinessLearningPathsLoading inputBg={inputBg} />
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen p-5 lg:p-8 space-y-6"
        style={{ backgroundColor: panelBg }}
      >
        <div className="space-y-6">
          <BusinessLearningPathsHero theme={logic.theme} />
          <BusinessLearningPathStats logic={logic} />
          <BusinessLearningPathsFeedback logic={logic} />
          <BusinessLearningPathsSearch logic={logic} />
          <BusinessLearningPathCards logic={logic} t={t} onOpenVideos={setVideosLearningPathId} />
          <BusinessLearningPathAssignments logic={logic} language={i18n.language} />
          <BusinessLearningPathModals
            logic={logic}
            videosLearningPathId={videosLearningPathId}
            selectedLearningPathForVideos={selectedLearningPathForVideos}
            onCloseVideos={() => setVideosLearningPathId(null)}
          />
        </div>
      </motion.div>
    </>
  )
}
