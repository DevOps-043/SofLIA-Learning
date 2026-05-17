import type { BusinessLearningPathsLogic } from './types'

export function BusinessLearningPathsFeedback({ logic }: { logic: BusinessLearningPathsLogic }) {
  const { successColor, dangerColor } = logic.theme
  return (
    <>
      {logic.feedback && (
        <div
          className="flex items-center justify-between gap-4 rounded-[1.5rem] border px-6 py-3.5 text-sm font-semibold"
          style={{
            backgroundColor: logic.feedback.type === 'success' ? `${successColor}12` : `${dangerColor}12`,
            borderColor: logic.feedback.type === 'success' ? `${successColor}28` : `${dangerColor}28`,
            color: logic.feedback.type === 'success' ? successColor : dangerColor,
          }}
        >
          <p>{logic.feedback.message}</p>
          <button type="button" onClick={() => logic.setFeedback(null)} className="text-[9px] font-black uppercase tracking-widest">OK</button>
        </div>
      )}
      {logic.error && (
        <div className="rounded-[1.5rem] border px-6 py-3.5 text-sm font-medium" style={{ backgroundColor: `${dangerColor}12`, borderColor: `${dangerColor}28`, color: dangerColor }}>
          {logic.error}
        </div>
      )}
    </>
  )
}
