import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createAdminModulesClient } from './admin-modules.client'
import type { AdminModule, CreateModuleData } from './admin-modules.types'

function extractModuleNumber(title: string): number | null {
  const match = title.match(/Módulo\s*(\d+)/i)
  return match ? parseInt(match[1], 10) : null
}

async function resolveNextModuleOrder(courseId: string, title: string) {
  const extractedNumber = extractModuleNumber(title)
  if (extractedNumber !== null) return extractedNumber

  const supabase = await createAdminModulesClient()
  const { data } = await supabase
    .from('course_modules')
    .select('module_order_index')
    .eq('course_id', courseId)
    .order('module_order_index', { ascending: false })
    .limit(1)
    .single()

  return (data?.module_order_index || 0) + 1
}

async function translateCreatedModule(module: AdminModule, userId?: string) {
  try {
    const { translateModuleOnCreate } = await import('@/core/services/courseTranslation.service')
    await translateModuleOnCreate(
      module.module_id,
      {
        module_title: module.module_title,
        module_description: module.module_description,
      },
      userId,
    )
  } catch (translationError) {
    techDebtLogger.error('Error en traducción automática del módulo:', translationError)
  }
}

export async function createModule(
  courseId: string,
  moduleData: CreateModuleData,
  userId?: string,
): Promise<AdminModule> {
  const supabase = await createAdminModulesClient()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('course_modules')
    .insert({
      course_id: courseId,
      module_title: moduleData.module_title,
      module_description: moduleData.module_description,
      module_order_index: await resolveNextModuleOrder(courseId, moduleData.module_title),
      module_duration_minutes: 0,
      is_required: moduleData.is_required ?? true,
      is_published: moduleData.is_published ?? false,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) throw error
  await translateCreatedModule(data, userId)
  return data
}
