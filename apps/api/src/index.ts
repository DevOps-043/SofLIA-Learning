import { createApp } from './app'
import { config } from './config/env'
import { logger } from './core/logging/logger'
import { attachLiaLiveWebSocket } from './features/lia/live/lia-live.websocket'

const app = createApp()
const port = config.PORT || 4000

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(port, () => {
    logger.info('Servidor Express iniciado', {
      environment: config.NODE_ENV,
      port,
    })
  })

  attachLiaLiveWebSocket(server, config.API_VERSION)
}

export default app
