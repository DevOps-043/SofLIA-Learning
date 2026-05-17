export type RelacionesTable = {
  Row: {
  id: number
  nombre: string
  slug: string
}
  Insert: {
  id?: number
  nombre: string
  slug: string
}
  Update: {
  id?: number
  nombre?: string
  slug?: string
}
  Relationships: []
}
