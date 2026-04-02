import type { eventWithTime } from '@rrweb/types'
import type { RrwebRecordOptions } from './rrweb-loader'
import { buildSessionRecorderPrivacyConfig } from './session-recorder-privacy'
import { appendRecordedEvent } from './session-recorder.utils'

export function buildSessionRecorderRecordOptions(params: {
  isDev: boolean
  getEvents: () => eventWithTime[]
  maxEvents: number
  getInitialSnapshot: () => eventWithTime | null
  setEvents: (events: eventWithTime[]) => void
  setInitialSnapshot: (snapshot: eventWithTime | null) => void
}): RrwebRecordOptions {
  return {
    emit: (event: eventWithTime) => {
      try {
        const nextState = appendRecordedEvent({
          events: params.getEvents(),
          event,
          maxEvents: params.maxEvents,
          initialSnapshot: params.getInitialSnapshot(),
        })

        params.setEvents(nextState.events)
        params.setInitialSnapshot(nextState.initialSnapshot)
      } catch (error) {
        if (
          error instanceof TypeError &&
          error.message.includes('MutationRecord')
        ) {
          console.warn('[SessionRecorder] Error ignorado en MutationRecord:', error.message)
          return
        }

        throw error
      }
    },
    checkoutEveryNms: params.isDev ? 10000 : 15000,
    checkoutEveryNth: params.isDev ? 200 : 300,
    recordCanvas: false,
    recordCrossOriginIframes: false,
    collectFonts: false,
    inlineStylesheet: false,
    sampling: {
      mousemove: true,
      mousemoveCallback: params.isDev ? 200 : 500,
      mouseInteraction: {
        MouseUp: params.isDev,
        MouseDown: params.isDev,
        Click: true,
        ContextMenu: false,
        DblClick: true,
        Focus: params.isDev,
        Blur: false,
        TouchStart: false,
        TouchEnd: false,
      },
      scroll: params.isDev ? 150 : 300,
      media: params.isDev ? 500 : 800,
      input: params.isDev ? true : 'last',
    },
    ignoreClass: 'rr-ignore',
    slimDOMOptions: {
      script: true,
      comment: true,
      headFavicon: true,
      headWhitespace: true,
      headMetaDescKeywords: true,
      headMetaSocial: true,
      headMetaRobots: true,
      headMetaHttpEquiv: true,
      headMetaAuthorship: true,
      headMetaVerification: true,
    },
    ...buildSessionRecorderPrivacyConfig(),
  }
}
