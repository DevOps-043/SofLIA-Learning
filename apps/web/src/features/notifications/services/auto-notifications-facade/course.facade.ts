import { CourseNotificationsService } from '../auto-notifications-courses.service'
import type { NotificationMetadata } from '../auto-notifications.shared'

export const courseNotificationFacade = {
  notifyCoursePublished(courseId: string, courseTitle: string, metadata?: NotificationMetadata) {
    return CourseNotificationsService.notifyCoursePublished(courseId, courseTitle, metadata)
  },
  notifyCourseEnrolled(
    userId: string,
    courseId: string,
    courseTitle: string,
    metadata?: NotificationMetadata,
  ) {
    return CourseNotificationsService.notifyCourseEnrolled(userId, courseId, courseTitle, metadata)
  },
  notifyCourseLessonCompleted(
    userId: string,
    courseId: string,
    courseTitle: string,
    lessonId: string,
    lessonTitle: string,
    metadata?: NotificationMetadata,
  ) {
    return CourseNotificationsService.notifyCourseLessonCompleted(
      userId,
      courseId,
      courseTitle,
      lessonId,
      lessonTitle,
      metadata,
    )
  },
  notifyCourseCompleted(
    userId: string,
    courseId: string,
    courseTitle: string,
    hasCertificate = false,
    metadata?: NotificationMetadata,
  ) {
    return CourseNotificationsService.notifyCourseCompleted(
      userId,
      courseId,
      courseTitle,
      hasCertificate,
      metadata,
    )
  },
  notifyCourseActivityCompleted(
    userId: string,
    courseId: string,
    courseTitle: string,
    lessonId: string,
    activityId: string,
    activityTitle: string,
    metadata?: NotificationMetadata,
  ) {
    return CourseNotificationsService.notifyCourseActivityCompleted(
      userId,
      courseId,
      courseTitle,
      lessonId,
      activityId,
      activityTitle,
      metadata,
    )
  },
  notifyCourseQuestionAnswered(
    questionId: string,
    questionAuthorId: string,
    answerAuthorId: string,
    courseId: string,
    courseTitle: string,
    answerPreview: string,
    metadata?: NotificationMetadata,
  ) {
    return CourseNotificationsService.notifyCourseQuestionAnswered(
      questionId,
      questionAuthorId,
      answerAuthorId,
      courseId,
      courseTitle,
      answerPreview,
      metadata,
    )
  },
}
