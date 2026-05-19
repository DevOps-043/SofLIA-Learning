'use client'

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { SofliaJoyride as Joyride } from '@/features/tours/components/SofliaJoyride'
import { useFeatureTour } from '@/features/tours/hooks/useFeatureTour'
import { ADMIN_PATHS_TOUR_ID, getAdminPathsSteps } from '@/features/tours/config/business-panel/admin-paths-steps'
import { useBusinessLearningPathsPageLogic } from '../hooks/useBusinessLearningPathsPageLogic'
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
  const tourSteps = useMemo(() => getAdminPathsSteps(t), [t])
  const { joyrideProps } = useFeatureTour({
    tourId: ADMIN_PATHS_TOUR_ID,
    steps: tourSteps,
    enabled: !logic.isLoading,
  })
  const selectedLearningPathForVideos = useMemo(
    () => logic.learningPaths.find((path) => path.id === videosLearningPathId) ?? null,
    [logic.learningPaths, videosLearningPathId],
  )

  if (logic.isLoading) {
    return <BusinessLearningPathsLoading inputBg={logic.theme.inputBg} />
  }

  return (
    <>
      {joyrideProps.run ? <Joyride {...joyrideProps} /> : null}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen p-5 lg:p-8 space-y-6"
        style={{ backgroundColor: logic.theme.panelBg }}
      >
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
      </motion.div>
    </>
  )
}
