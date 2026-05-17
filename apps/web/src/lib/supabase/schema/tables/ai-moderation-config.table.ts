export type AiModerationConfigTable = {
  Row: {
  config_key: string
  config_value: string
  description: string | null
  id: string
  updated_at: string
  updated_by: string | null
}
  Insert: {
  config_key: string
  config_value: string
  description?: string | null
  id?: string
  updated_at?: string
  updated_by?: string | null
}
  Update: {
  config_key?: string
  config_value?: string
  description?: string | null
  id?: string
  updated_at?: string
  updated_by?: string | null
}
  Relationships: []
}
