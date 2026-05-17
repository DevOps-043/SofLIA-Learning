export type RolesTable = {
  Row: {
  area_id: number | null
  id: number
  nombre: string
  slug: string
}
  Insert: {
  area_id?: number | null
  id?: number
  nombre: string
  slug: string
}
  Update: {
  area_id?: number | null
  id?: number
  nombre?: string
  slug?: string
}
  Relationships: [
    { foreignKeyName: "roles_area_id_fkey"; columns: ["area_id"]; isOneToOne: false; referencedRelation: "areas"; referencedColumns: ["id"] },
  ]
}
