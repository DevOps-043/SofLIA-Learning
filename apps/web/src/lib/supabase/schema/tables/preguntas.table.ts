import type { Json } from '../json'

export type PreguntasTable = {
  Row: {
  area_id: number | null
  bloque: string | null
  codigo: string | null
  created_at: string
  dificultad: number | null
  dimension: Json | null
  escala: Json | null
  exclusivo_nivel_id: number | null
  exclusivo_rol_id: number | null
  id: number
  locale: string | null
  opciones: Json | null
  peso: number | null
  respuesta_correcta: string | null
  scoring: Json | null
  section: string | null
  texto: string
  tipo: string
}
  Insert: {
  area_id?: number | null
  bloque?: string | null
  codigo?: string | null
  created_at?: string
  dificultad?: number | null
  dimension?: Json | null
  escala?: Json | null
  exclusivo_nivel_id?: number | null
  exclusivo_rol_id?: number | null
  id?: number
  locale?: string | null
  opciones?: Json | null
  peso?: number | null
  respuesta_correcta?: string | null
  scoring?: Json | null
  section?: string | null
  texto: string
  tipo: string
}
  Update: {
  area_id?: number | null
  bloque?: string | null
  codigo?: string | null
  created_at?: string
  dificultad?: number | null
  dimension?: Json | null
  escala?: Json | null
  exclusivo_nivel_id?: number | null
  exclusivo_rol_id?: number | null
  id?: number
  locale?: string | null
  opciones?: Json | null
  peso?: number | null
  respuesta_correcta?: string | null
  scoring?: Json | null
  section?: string | null
  texto?: string
  tipo?: string
}
  Relationships: [
    { foreignKeyName: "preguntas_area_id_fkey"; columns: ["area_id"]; isOneToOne: false; referencedRelation: "areas"; referencedColumns: ["id"] },
    { foreignKeyName: "preguntas_exclusivo_nivel_id_fkey"; columns: ["exclusivo_nivel_id"]; isOneToOne: false; referencedRelation: "niveles"; referencedColumns: ["id"] },
    { foreignKeyName: "preguntas_exclusivo_rol_id_fkey"; columns: ["exclusivo_rol_id"]; isOneToOne: false; referencedRelation: "roles"; referencedColumns: ["id"] },
  ]
}
