import type { Tables } from '@/lib/supabase/types'
import type { AdminModule } from './admin-modules.types'

type CourseModuleRow = Tables<'course_modules'>

export function mapAdminModule(row: CourseModuleRow): AdminModule {
  return {
    module_id: row.module_id,
    module_title: row.module_title,
    module_description: row.module_description,
    module_order_index: row.module_order_index,
    module_duration_minutes: row.module_duration_minutes ?? 0,
    is_required: row.is_required ?? false,
    is_published: row.is_published ?? false,
    course_id: row.course_id,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  }
}
