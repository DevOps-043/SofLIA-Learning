import { logger } from '@/lib/logger'

interface LoginSuccessNotificationInput {
  ip: string
  rememberMe: boolean
  userAgent: string
  userId: string
}

export async function notifyLoginSuccess(
  input: LoginSuccessNotificationInput
): Promise<void> {
  try {
    logger.info('Iniciando creacion de notificacion de login', {
      userId: input.userId,
    })
    const { AutoNotificationsService } = await import(
      '@/features/notifications/services/auto-notifications.service'
    )

    await Promise.race([
      AutoNotificationsService.notifyLoginSuccess(
        input.userId,
        input.ip,
        input.userAgent,
        {
          rememberMe: input.rememberMe,
          timestamp: new Date().toISOString(),
        }
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 2000)
      ),
    ]).catch((error) => {
      if (error instanceof Error && error.message === 'Timeout') {
        logger.warn('Timeout en notificacion de login, continuando', {
          userId: input.userId,
        })
        return
      }

      logger.error('Error en notificacion de login:', {
        error: error instanceof Error ? error.message : String(error),
        userId: input.userId,
      })
    })
    logger.info('Notificacion de login procesada', { userId: input.userId })
  } catch (notificationError) {
    logger.error('Error en notificacion de login:', {
      error:
        notificationError instanceof Error
          ? notificationError.message
          : String(notificationError),
      userId: input.userId,
    })
  }
}
