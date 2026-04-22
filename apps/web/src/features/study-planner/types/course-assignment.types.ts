import type { CourseLevel, AssignmentStatus, UserType } from './user-profile.types';

export interface CourseInfo {
  id: string;
  title: string;
  description?: string;
  slug: string;
  category: string;
  level: CourseLevel;
  instructorId?: string;
  instructorName?: string;
  thumbnailUrl?: string;
  durationTotalMinutes: number;
  isActive: boolean;
  price?: number;
  averageRating?: number;
  studentCount?: number;
}

export interface CourseModule {
  moduleId: string;
  moduleTitle: string;
  moduleDescription?: string;
  moduleOrderIndex: number;
  moduleDurationMinutes: number;
  isRequired: boolean;
  isPublished: boolean;
  lessons: LessonInfo[];
}

export interface LessonInfo {
  lessonId: string;
  lessonTitle: string;
  lessonDescription?: string;
  lessonOrderIndex: number;
  durationSeconds: number;
  moduleId: string;
  isPublished: boolean;
}

export interface LessonDuration {
  lessonId: string;
  lessonTitle: string;
  videoMinutes: number;
  activitiesMinutes: number;
  materialsMinutes: number;
  interactionsMinutes: number;
  totalMinutes: number;
  isEstimated: boolean;
}

export interface CourseComplexity {
  courseId: string;
  level: CourseLevel;
  category: string;
  totalLessons: number;
  totalModules: number;
  totalDurationMinutes: number;
  averageLessonDuration: number;
  complexityScore: number;
  recommendedSessionMinutes: number;
  recommendedBreakMinutes: number;
}

export interface B2BCourseAssignment {
  id: string;
  organizationId: string;
  organizationName?: string;
  userId: string;
  courseId: string;
  course: CourseInfo;
  assignedBy?: string;
  assignedByName?: string;
  assignedAt: string;
  dueDate?: string;
  status: AssignmentStatus;
  completionPercentage: number;
  completedAt?: string;
  message?: string;
}

export interface TeamCourseAssignment {
  id: string;
  teamId: string;
  teamName: string;
  organizationId?: string;
  organizationName?: string;
  courseId: string;
  course: CourseInfo;
  assignedBy: string;
  assignedByName?: string;
  assignedAt: string;
  dueDate?: string;
  status: AssignmentStatus;
  message?: string;
}

export interface B2CCoursePurchase {
  purchaseId: string;
  userId: string;
  courseId: string;
  course: CourseInfo;
  purchasedAt: string;
  accessStatus: 'active' | 'suspended' | 'expired' | 'cancelled';
  expiresAt?: string;
  completionPercentage?: number;
}

export interface CourseAssignment {
  courseId: string;
  course: CourseInfo;
  userType: UserType;
  dueDate?: string;
  hasActivePlan?: boolean;
  assignedBy?: string;
  organizationId?: string;
  organizationName?: string;
  status: AssignmentStatus | 'active';
  completionPercentage: number;
  completedLessons?: number;
  totalLessons?: number;
  lastAccessedAt?: string;
  source: 'organization' | 'team' | 'purchase';
}

export interface LearningRoute {
  id: string;
  userId: string;
  name: string;
  description?: string;
  courses: CourseInfo[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LearningRouteSuggestion {
  name: string;
  description: string;
  courses: CourseInfo[];
  reason: string;
  estimatedDuration: number;
  difficulty: CourseLevel;
  skills: string[];
}
