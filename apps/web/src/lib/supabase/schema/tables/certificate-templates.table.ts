import type { Json } from '../json'

export type CertificateTemplatesTable = {
  Row: {
  created_at: string | null
  description: string | null
  design_config: Json
  id: string
  is_active: boolean | null
  is_default: boolean | null
  name: string
  organization_id: string
  updated_at: string | null
}
  Insert: {
  created_at?: string | null
  description?: string | null
  design_config?: Json
  id?: string
  is_active?: boolean | null
  is_default?: boolean | null
  name: string
  organization_id: string
  updated_at?: string | null
}
  Update: {
  created_at?: string | null
  description?: string | null
  design_config?: Json
  id?: string
  is_active?: boolean | null
  is_default?: boolean | null
  name?: string
  organization_id?: string
  updated_at?: string | null
}
  Relationships: [
    { foreignKeyName: "certificate_templates_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "certificate_templates_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "certificate_templates_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
  ]
}
