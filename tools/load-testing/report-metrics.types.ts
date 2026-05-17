export interface MutableEndpointStats {
  flow: string
  name: string
  method: string
  url: string
  count: number
  ok: number
  failed: number
  status4xx: number
  status401: number
  status5xx: number
  status429: number
  edge403Html: number
  timeouts: number
  bytes: number
  durations: number[]
}
