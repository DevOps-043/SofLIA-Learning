import type { BusinessUserStatsLessonProgressRecord, BusinessUserStatsLessonRecord, BusinessUserStatsQueryData } from '../business-user-stats-query.service'
import { unwrapRelation } from '../business-user-stats-query.service'

export type LessonDetailIndexes = ReturnType<typeof buildLessonDetailIndexes>

export function buildLessonDetailIndexes(data: BusinessUserStatsQueryData) {
  const progressByLesson = new Map<string, BusinessUserStatsLessonProgressRecord>()
  data.lessonProgress.forEach((progress) => progressByLesson.set(progress.lesson_id, progress))
  const lessonMetaById = new Map<string, BusinessUserStatsLessonRecord>()
  data.lessons.forEach((lesson) => lessonMetaById.set(lesson.lesson_id, lesson))
  const { liaConvByLesson, liaMsgByLesson } = buildLiaIndexes(data)
  const notesByLesson = buildNotesByLesson(data)
  const quizByLesson = buildQuizByLesson(data)
  const lessonsByCourse = buildLessonsByCourse(data.lessons)

  return { progressByLesson, lessonMetaById, liaConvByLesson, liaMsgByLesson, notesByLesson, quizByLesson, lessonsByCourse }
}

function buildLiaIndexes(data: BusinessUserStatsQueryData) {
  const liaConvByLesson = new Map<string, number>()
  const liaMsgByLesson = new Map<string, number>()
  data.liaConversations.forEach((conversation) => {
    if (!conversation.lesson_id) return
    liaConvByLesson.set(conversation.lesson_id, (liaConvByLesson.get(conversation.lesson_id) ?? 0) + 1)
    liaMsgByLesson.set(conversation.lesson_id, (liaMsgByLesson.get(conversation.lesson_id) ?? 0) + (conversation.total_messages ?? 0))
  })
  return { liaConvByLesson, liaMsgByLesson }
}

function buildNotesByLesson(data: BusinessUserStatsQueryData) {
  const notesByLesson = new Map<string, number>()
  data.lessonNotes.forEach((note) => {
    if (note.lesson_id) notesByLesson.set(note.lesson_id, (notesByLesson.get(note.lesson_id) ?? 0) + 1)
  })
  return notesByLesson
}

function buildQuizByLesson(data: BusinessUserStatsQueryData) {
  const quizByLesson = new Map<string, { passed: boolean; score: number | null }>()
  data.quizSubmissions.forEach((quiz) => {
    if (!quiz.lesson_id) return
    const existing = quizByLesson.get(quiz.lesson_id)
    const score = quiz.percentage_score ?? null
    if (!existing || (score ?? 0) > (existing.score ?? 0)) quizByLesson.set(quiz.lesson_id, { passed: quiz.is_passed ?? false, score })
  })
  return quizByLesson
}

function buildLessonsByCourse(lessons: BusinessUserStatsLessonRecord[]) {
  const lessonsByCourse = new Map<string, BusinessUserStatsLessonRecord[]>()
  lessons.forEach((lesson) => {
    const courseId = unwrapRelation(lesson.course_modules)?.course_id
    if (!courseId) return
    if (!lessonsByCourse.has(courseId)) lessonsByCourse.set(courseId, [])
    lessonsByCourse.get(courseId)?.push(lesson)
  })
  return lessonsByCourse
}
