export { deepParseJsonValue } from './course-content/json'
export { extractDisplayContent } from './course-content/display-content'
export {
  normalizeActivityContentForClient,
  normalizeContentForRenderer,
  normalizeImportedActivityContent,
  normalizeImportedMaterialContent,
  normalizeMaterialContentForClient,
} from './course-content/normalizers'
export {
  normalizeLessonActivityRecord,
  normalizeLessonMaterialRecord,
} from './course-content/record-normalizers'
export {
  normalizeQuizQuestion,
  normalizeQuizQuestions,
  type NormalizedQuizQuestion,
  type RawQuizQuestion,
} from './course-content/quiz-normalize'
export {
  findQuizAnswerKeyConflict,
  type QuizAnswerKeyConflict,
} from './course-content/quiz-consistency'
