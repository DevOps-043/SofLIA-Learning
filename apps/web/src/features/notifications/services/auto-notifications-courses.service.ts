import { NotificationService } from './notification.service'
import { getNotificationPriority } from '../utils/notification-categories'
import { logger } from '@/lib/logger'
import { getServerClient } from './auto-notifications-server-client'
import {
  resolveNotificationOrganizationId,
  type NotificationMetadata,
} from './auto-notifications.shared'

/**
 * Notificaciones automáticas relacionadas con cursos.
 */
export class CourseNotificationsService {
  /**
   * Crea notificaciones para usuarios cuando se publica un curso
   */
  static async notifyCoursePublished(
    courseId: string,
    courseTitle: string,
    metadata?: NotificationMetadata
  ): Promise<void> {
    try {
      const supabase = await getServerClient()

      const { data: users, error } = await supabase
        .from('users')
        .select('id')
        .eq('is_banned', false)
        .limit(1000)

      if (error) {
        logger.error('Error obteniendo usuarios para notificar curso:', error)
        return
      }

      if (!users || users.length === 0) {
        logger.info('No hay usuarios para notificar sobre el curso', { courseId })
        return
      }

      const notifications = users.map(user => ({
        userId: user.id,
        notificationType: 'course_published',
        title: 'notifications.types.course_published.title',
        message: 'notifications.types.course_published.message',
        isLocalized: true,
        metadata: {
          ...metadata,
          courseTitle,
          course_id: courseId,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('course_published')
      }))

      const batchSize = 100
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize)
        for (const notification of batch) {
          await NotificationService.createNotification(notification)
        }
      }

      logger.info('✅ Notificaciones de curso publicado creadas', {
        courseId,
        count: notifications.length
      })
    } catch (error) {
      logger.error('❌ Error creando notificaciones de curso publicado:', error)
    }
  }

  /**
   * Crea una notificación para un usuario cuando se inscribe en un curso
   */
  static async notifyCourseEnrolled(
    userId: string,
    courseId: string,
    courseTitle: string,
    metadata?: NotificationMetadata
  ): Promise<void> {
    try {
      await NotificationService.createNotification({
        userId,
        notificationType: 'course_enrolled',
        title: 'notifications.types.course_enrolled.title',
        message: 'notifications.types.course_enrolled.message',
        isLocalized: true,
        organizationId: resolveNotificationOrganizationId(metadata),
        metadata: {
          ...metadata,
          courseTitle,
          course_id: courseId,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('course_enrolled')
      })
      logger.info('✅ Notificación de inscripción en curso creada', { userId, courseId })
    } catch (error) {
      logger.error('❌ Error creando notificación de inscripción en curso:', error)
    }
  }

  /**
   * Crea una notificación cuando se completa una lección de un curso
   */
  static async notifyCourseLessonCompleted(
    userId: string,
    courseId: string,
    courseTitle: string,
    lessonId: string,
    lessonTitle: string,
    metadata?: NotificationMetadata
  ): Promise<void> {
    try {
      await NotificationService.createNotification({
        userId,
        notificationType: 'course_lesson_completed',
        title: 'notifications.types.course_lesson_completed.title',
        message: 'notifications.types.course_lesson_completed.message',
        isLocalized: true,
        organizationId: resolveNotificationOrganizationId(metadata),
        metadata: {
          ...metadata,
          course_id: courseId,
          lesson_id: lessonId,
          courseTitle,
          lessonTitle,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('course_lesson_completed')
      })

      logger.info('✅ Notificación de lección completada creada', {
        userId,
        courseId,
        lessonId
      })
    } catch (error) {
      logger.error('❌ Error creando notificación de lección completada:', error)
    }
  }

  /**
   * Crea una notificación cuando se completa un curso completo
   */
  static async notifyCourseCompleted(
    userId: string,
    courseId: string,
    courseTitle: string,
    hasCertificate: boolean = false,
    metadata?: NotificationMetadata
  ): Promise<void> {
    try {
      const type = hasCertificate ? 'course_completed_with_certificate' : 'course_completed'

      await NotificationService.createNotification({
        userId,
        notificationType: 'course_completed',
        title: `notifications.types.${type}.title`,
        message: `notifications.types.${type}.message`,
        isLocalized: true,
        organizationId: resolveNotificationOrganizationId(metadata),
        metadata: {
          ...metadata,
          course_id: courseId,
          courseTitle,
          has_certificate: hasCertificate,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('course_completed')
      })

      logger.info('✅ Notificación de curso completado creada', {
        userId,
        courseId,
        hasCertificate
      })
    } catch (error) {
      logger.error('❌ Error creando notificación de curso completado:', error)
    }
  }

  /**
   * Crea una notificacion cuando se completa una actividad de una leccion.
   */
  static async notifyCourseActivityCompleted(
    userId: string,
    courseId: string,
    courseTitle: string,
    lessonId: string,
    activityId: string,
    activityTitle: string,
    metadata?: NotificationMetadata
  ): Promise<void> {
    try {
      const courseSlug = typeof metadata?.courseSlug === 'string'
        ? metadata.courseSlug
        : null

      await NotificationService.createNotification({
        userId,
        notificationType: 'course_activity_completed',
        title: 'notifications.types.course_activity_completed.title',
        message: 'notifications.types.course_activity_completed.message',
        isLocalized: true,
        organizationId: resolveNotificationOrganizationId(metadata),
        metadata: {
          ...metadata,
          action_url: courseSlug ? `/courses/${courseSlug}/learn` : metadata?.action_url,
          activity_id: activityId,
          activityTitle,
          course_id: courseId,
          courseTitle,
          lesson_id: lessonId,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('course_activity_completed')
      })

      logger.info('Notificacion de actividad completada creada', {
        activityId,
        courseId,
        userId,
      })
    } catch (error) {
      logger.error('Error creando notificacion de actividad completada:', error)
    }
  }

  /**
   * Crea una notificación cuando se responde una pregunta del curso.
   * Notifica al autor de la pregunta.
   */
  static async notifyCourseQuestionAnswered(
    questionId: string,
    questionAuthorId: string,
    answerAuthorId: string,
    courseId: string,
    courseTitle: string,
    answerPreview: string,
    metadata?: NotificationMetadata
  ): Promise<void> {
    try {
      if (questionAuthorId === answerAuthorId) {
        return
      }

      const supabase = await getServerClient()

      const { data: answerAuthor } = await supabase
        .from('users')
        .select('username, display_name, first_name')
        .eq('id', answerAuthorId)
        .single()

      const answerAuthorName = answerAuthor?.display_name || answerAuthor?.first_name || answerAuthor?.username || 'Un usuario'

      const truncatedPreview = answerPreview.length > 100
        ? answerPreview.substring(0, 100) + '...'
        : answerPreview

      await NotificationService.createNotification({
        userId: questionAuthorId,
        notificationType: 'course_question_answered',
        title: 'notifications.types.course_question_answered.title',
        message: 'notifications.types.course_question_answered.message',
        isLocalized: true,
        metadata: {
          ...metadata,
          answerAuthorName,
          courseTitle,
          question_id: questionId,
          course_id: courseId,
          course_title: courseTitle,
          answer_author_id: answerAuthorId,
          answer_preview: truncatedPreview,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('course_question_answered')
      })

      logger.info('✅ Notificación de pregunta respondida creada', {
        questionId,
        questionAuthorId,
        answerAuthorId
      })
    } catch (error) {
      logger.error('❌ Error creando notificación de pregunta respondida:', error)
    }
  }
}
