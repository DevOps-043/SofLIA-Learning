export type TamanosEmpresaTable = {
  Row: {
  id: number
  max_empleados: number | null
  min_empleados: number | null
  nombre: string
  slug: string
}
  Insert: {
  id?: number
  max_empleados?: number | null
  min_empleados?: number | null
  nombre: string
  slug: string
}
  Update: {
  id?: number
  max_empleados?: number | null
  min_empleados?: number | null
  nombre?: string
  slug?: string
}
  Relationships: []
}
