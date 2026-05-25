export type UserPerfilTable = {
  Row: {
  actualizado_en: string
  area_id: number | null
  cargo_titulo: string | null
  creado_en: string
  dificultad_id: number | null
  id: string
  nivel_id: number | null
  pais: string | null
  relacion_id: number | null
  rol_id: number | null
  sector_id: number | null
  tamano_id: number | null
  user_id: string
  uso_ia_respuesta: string | null
}
  Insert: {
  actualizado_en?: string
  area_id?: number | null
  cargo_titulo?: string | null
  creado_en?: string
  dificultad_id?: number | null
  id?: string
  nivel_id?: number | null
  pais?: string | null
  relacion_id?: number | null
  rol_id?: number | null
  sector_id?: number | null
  tamano_id?: number | null
  user_id: string
  uso_ia_respuesta?: string | null
}
  Update: {
  actualizado_en?: string
  area_id?: number | null
  cargo_titulo?: string | null
  creado_en?: string
  dificultad_id?: number | null
  id?: string
  nivel_id?: number | null
  pais?: string | null
  relacion_id?: number | null
  rol_id?: number | null
  sector_id?: number | null
  tamano_id?: number | null
  user_id?: string
  uso_ia_respuesta?: string | null
}
  Relationships: [
    { foreignKeyName: "user_perfil_area_id_fkey"; columns: ["area_id"]; isOneToOne: false; referencedRelation: "areas"; referencedColumns: ["id"] },
    { foreignKeyName: "user_perfil_nivel_id_fkey"; columns: ["nivel_id"]; isOneToOne: false; referencedRelation: "niveles"; referencedColumns: ["id"] },
    { foreignKeyName: "user_perfil_relacion_id_fkey"; columns: ["relacion_id"]; isOneToOne: false; referencedRelation: "relaciones"; referencedColumns: ["id"] },
    { foreignKeyName: "user_perfil_rol_id_fkey"; columns: ["rol_id"]; isOneToOne: false; referencedRelation: "roles"; referencedColumns: ["id"] },
    { foreignKeyName: "user_perfil_sector_id_fkey"; columns: ["sector_id"]; isOneToOne: false; referencedRelation: "sectores"; referencedColumns: ["id"] },
    { foreignKeyName: "user_perfil_tamano_id_fkey"; columns: ["tamano_id"]; isOneToOne: false; referencedRelation: "tamanos_empresa"; referencedColumns: ["id"] },
    { foreignKeyName: "user_perfil_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_perfil_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "user_perfil_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_perfil_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
