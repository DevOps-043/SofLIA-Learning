import type { Json } from '../json'

export type RespuestasTable = {
  Row: {
  id: number
  pregunta_id: number
  respondido_en: string
  user_perfil_id: string
  valor: Json | null
}
  Insert: {
  id?: number
  pregunta_id: number
  respondido_en?: string
  user_perfil_id: string
  valor?: Json | null
}
  Update: {
  id?: number
  pregunta_id?: number
  respondido_en?: string
  user_perfil_id?: string
  valor?: Json | null
}
  Relationships: [
    { foreignKeyName: "fk_respuestas_user_perfil_id"; columns: ["user_perfil_id"]; isOneToOne: false; referencedRelation: "user_perfil"; referencedColumns: ["id"] },
    { foreignKeyName: "respuestas_pregunta_id_fkey"; columns: ["pregunta_id"]; isOneToOne: false; referencedRelation: "preguntas"; referencedColumns: ["id"] },
  ]
}
