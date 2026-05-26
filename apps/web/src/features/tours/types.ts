export type TourId =
  | 'business-user-dashboard'
  | 'business-panel-dashboard'
  | 'business-panel-users'
  | 'business-panel-reports'
  | 'business-panel-analytics'
  | 'business-panel-learning-paths'
  | 'business-user-analytics'
  | 'study-planner-dashboard'
  | 'course-learn'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-companies'
  | 'user-dashboard'
  | 'user-profile'

export type TourPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'right'
  | 'center'
  | 'auto'

export interface TourStep {
  target: string
  titleKey: string
  contentKey: string
  placement?: TourPlacement
  spotlightClicks?: boolean
  disableBeacon?: boolean
  optional?: boolean
}

export interface TourConfig {
  id: TourId
  steps: TourStep[]
  autoStart?: boolean
}

export interface TourStoreState {
  activeTourConfig: TourConfig | null
  currentStep: number
  isRunning: boolean
  completedTours: TourId[]
}

export interface TourStoreActions {
  startTour: (config: TourConfig) => void
  stopTour: () => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  markCompleted: (id: TourId) => void
  hasCompleted: (id: TourId) => boolean
  resetTour: (id: TourId) => void
}

export type TourState = TourStoreState & TourStoreActions
