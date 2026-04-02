import type { CourseDiff } from '../../../../lib/courseDiff';

export interface PendingCourseInstructor {
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  profile_picture_url?: string | null;
}

export interface PendingCourseActivity {
  activity_id: string;
  activity_title?: string | null;
  activity_type?: string | null;
  activity_content?: unknown;
  instructions?: string | null;
  prompt?: string | null;
  content_data?: unknown;
}

export interface PendingCourseMaterial {
  material_id: string;
  material_title: string;
  material_type?: string | null;
  file_url?: string | null;
  external_url?: string | null;
  content_data?: unknown;
}

export interface PendingCourseLesson {
  lesson_id: string;
  lesson_title: string;
  duration_seconds: number;
  video_provider: string;
  video_provider_id: string;
  transcript_content?: string | null;
  summary_content?: string | null;
  activities?: PendingCourseActivity[];
  materials?: PendingCourseMaterial[];
}

export interface PendingCourseModule {
  module_id: string;
  module_order_index: number;
  module_title: string;
  lessons?: PendingCourseLesson[];
}

export interface PendingCourseDetail {
  approval_status: string;
  category?: string | null;
  description?: string | null;
  diff?: CourseDiff | null;
  duration_total_minutes: number;
  instructor?: PendingCourseInstructor | null;
  is_update?: boolean | null;
  level?: string | null;
  modules?: PendingCourseModule[];
  thumbnail_url?: string | null;
  title: string;
}
