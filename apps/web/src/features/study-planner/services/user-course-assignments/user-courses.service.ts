import type {
  CourseAssignment,
  UserType,
} from '../../types/user-context.types'
import { getTeamCourseAssignments } from './hierarchy.service'
import { getB2BCourseAssignments } from './organization.service'
import { getB2CCoursePurchases } from './purchases.service'

export async function getUserCourses(
  userId: string,
  userType: UserType,
): Promise<CourseAssignment[]> {
  if (userType === 'b2b') {
    const [orgAssignments, teamAssignments] = await Promise.all([
      getB2BCourseAssignments(userId),
      getTeamCourseAssignments(userId),
    ])

    const courses: CourseAssignment[] = orgAssignments.map((assignment) => ({
      courseId: assignment.courseId,
      course: assignment.course,
      userType: 'b2b',
      dueDate: assignment.dueDate,
      assignedBy: assignment.assignedByName,
      organizationId: assignment.organizationId,
      organizationName: assignment.organizationName,
      status: assignment.status,
      completionPercentage: assignment.completionPercentage,
      source: 'organization',
    }))

    addUniqueTeamCourses(courses, teamAssignments)
    return courses
  }

  const purchases = await getB2CCoursePurchases(userId)

  return purchases.map((purchase) => ({
    courseId: purchase.courseId,
    course: purchase.course,
    userType: 'b2c',
    status: 'active',
    completionPercentage: purchase.completionPercentage ?? 0,
    source: 'purchase',
  }))
}

function addUniqueTeamCourses(
  courses: CourseAssignment[],
  teamAssignments: Awaited<ReturnType<typeof getTeamCourseAssignments>>,
): void {
  const assignedKeys = new Set(
    courses.map((course) => `${course.courseId}::${course.organizationId ?? ''}`),
  )

  for (const assignment of teamAssignments) {
    const key = `${assignment.courseId}::`
    if (!assignedKeys.has(key)) {
      courses.push({
        courseId: assignment.courseId,
        course: assignment.course,
        userType: 'b2b',
        dueDate: assignment.dueDate,
        assignedBy: assignment.assignedByName,
        status: assignment.status,
        completionPercentage: 0,
        source: 'team',
      })
      assignedKeys.add(key)
    }
  }
}
