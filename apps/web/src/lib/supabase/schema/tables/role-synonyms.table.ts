export type RoleSynonymsTable = {
  Row: {
  alias: string
  id: number
  role_id: number | null
}
  Insert: {
  alias: string
  id?: number
  role_id?: number | null
}
  Update: {
  alias?: string
  id?: number
  role_id?: number | null
}
  Relationships: [
    { foreignKeyName: "role_synonyms_role_id_fkey"; columns: ["role_id"]; isOneToOne: false; referencedRelation: "roles"; referencedColumns: ["id"] },
  ]
}
