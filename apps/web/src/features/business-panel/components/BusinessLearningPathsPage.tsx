'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

import { useBusinessLearningPathsPageLogic } from '../hooks/useBusinessLearningPathsPageLogic'
import { useTour } from '@/features/tours'
import { businessPanelLearningPathsTour } from '@/features/tours/config/business-panel-learning-paths.tour'
import { ToastNotification } from '@/core/components/ToastNotification/ToastNotification'
import { BusinessLearningPathAssignments } from './BusinessLearningPathsPage/Assignments'
import { BusinessLearningPathCards } from './BusinessLearningPathsPage/Cards'
import { BusinessLearningPathsFeedback } from './BusinessLearningPathsPage/Feedback'
import { BusinessLearningPathsHero } from './BusinessLearningPathsPage/Hero'
import { BusinessLearningPathsLoading } from './BusinessLearningPathsPage/LoadingState'
import { BusinessLearningPathModals } from './BusinessLearningPathsPage/Modals'
import { BusinessLearningPathsSearch } from './BusinessLearningPathsPage/Search'
import { BusinessLearningPathStats } from './BusinessLearningPathsPage/Stats'
import styles from '@/app/[orgSlug]/business-panel/courses/ContentPanel.module.css'

export function BusinessLearningPathsPage() {
  const { t, i18n } = useTranslation('business')
  const logic = useBusinessLearningPathsPageLogic()
  const [videosLearningPathId, setVideosLearningPathId] = useState<string | null>(null)
  const { autoStartIfNeeded } = useTour(businessPanelLearningPathsTour)

  useEffect(() => {
    // Wait until content is loaded so tour targets (#tour-paths-hero, etc.) are in the DOM.
    // autoStartIfNeeded already handles hasCompleted and isRunning guards internally,
    // and retries when isRunning changes to false (its identity changes with isRunning).
    if (logic.isLoading) return
    return autoStartIfNeeded()
  }, [logic.isLoading, autoStartIfNeeded])
  const selectedLearningPathForVideos = useMemo(
    () => logic.learningPaths.find((path) => path.id === videosLearningPathId) ?? null,
    [logic.learningPaths, videosLearningPathId],
  )
  if (logic.isLoading) {
    return <BusinessLearningPathsLoading />
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={styles.contentStack}
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
      <ToastNotification
        isOpen={logic.toast.isOpen}
        onClose={logic.hideToast}
        message={logic.toast.message}
        type={logic.toast.type}
        position="top-right"
      />
    </>
  )
}
