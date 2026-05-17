export type {
  AvailabilityStatus,
  CourseQueryRow,
  CourseWithInstructor,
  FavoriteQueryRow,
  InstructorQueryRow,
  PurchaseQueryRow,
  QueryResult,
  SingleQueryResult,
} from './course-service/course-query.types'
export {
  extractFavoriteCourseIds,
  extractPurchasedCourseIds,
} from './course-service/course-access.utils'
export {
  formatCoursePrice,
  getInstructorInfo,
  mapCourseDifficulty,
  mapCourseRowToCourse,
} from './course-service/course-row.mapper'
