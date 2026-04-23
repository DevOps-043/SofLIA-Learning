export interface LearnVideoPlayerContext {
  saveVideoProgress: (lessonId: string, time: number) => void
  setIsPiPActive: (active: boolean) => void
  setShouldAutoPlay: (autoPlay: boolean) => void
}
