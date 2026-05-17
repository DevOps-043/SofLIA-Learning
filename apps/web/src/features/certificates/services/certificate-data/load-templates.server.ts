import type { CertificateRow, SupabaseServerClient, TemplateRow } from './types'

export async function loadTemplates(
  supabase: SupabaseServerClient,
  certificateRows: CertificateRow[],
  organizationIds: string[],
): Promise<{
  explicitTemplates: Map<string, TemplateRow>
  defaultTemplates: Map<string, TemplateRow>
}> {
  const explicitTemplates = new Map<string, TemplateRow>()
  const defaultTemplates = new Map<string, TemplateRow>()
  const templateIds = certificateRows
    .map(row => row.template_id)
    .filter((value): value is string => Boolean(value))

  if (templateIds.length > 0) {
    const { data, error } = await supabase
      .from('certificate_templates')
      .select('id, organization_id, design_config, is_default')
      .in('id', templateIds)

    if (error) {
      throw error
    }

    for (const template of (data || []) as TemplateRow[]) {
      explicitTemplates.set(template.id, template)
    }
  }

  if (organizationIds.length > 0) {
    const { data, error } = await supabase
      .from('certificate_templates')
      .select('id, organization_id, design_config, is_default')
      .in('organization_id', organizationIds)
      .eq('is_active', true)
      .eq('is_default', true)

    if (error) {
      throw error
    }

    for (const template of (data || []) as TemplateRow[]) {
      defaultTemplates.set(template.organization_id, template)
    }
  }

  return {
    explicitTemplates,
    defaultTemplates,
  }
}
