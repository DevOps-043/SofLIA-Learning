export type { LearningStats, PurchasedCourse } from "./purchased-courses/purchased-course.types";
import { getUserLearningStats } from "./purchased-courses/get-user-learning-stats";
import { getUserPurchasedCourses } from "./purchased-courses/get-user-purchased-courses";
import { isCoursePurchased } from "./purchased-courses/is-course-purchased";

export class PurchasedCoursesService {
  static getUserPurchasedCourses = getUserPurchasedCourses;
  static isCoursePurchased = isCoursePurchased;
  static getUserLearningStats = getUserLearningStats;
}
