import type { Json } from '../json'

export type CertificateLedgerTable = {
  Row: {
  block_hash: string
  block_id: number
  cert_id: string
  created_at: string
  op: string
  payload: Json
  prev_hash: string | null
}
  Insert: {
  block_hash: string
  block_id?: number
  cert_id: string
  created_at?: string
  op: string
  payload?: Json
  prev_hash?: string | null
}
  Update: {
  block_hash?: string
  block_id?: number
  cert_id?: string
  created_at?: string
  op?: string
  payload?: Json
  prev_hash?: string | null
}
  Relationships: []
}
