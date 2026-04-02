import { createApp } from './app'
import { config } from './config/env'
import { logger } from './core/logging/logger'

const app = createApp()
const port = config.PORT || 4000

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    logger.info('Servidor Express iniciado', {
      environment: config.NODE_ENV,
      port,
    })
  })
}

export default app
