export type LoadProfileName = 'smoke' | 'load' | 'stress' | 'spike' | 'soak'

export interface LoadTestConfig {
  baseUrl: string
  runId: string
  targetVus: number
  seedUsers: number
  aiRatio: number
  orgSlug: string
  resultDir: string
  supabaseUrl?: string
  supabaseServiceRoleKey?: string
  netlifySiteId?: string
  netlifyToken?: string
  dbMetricsRpc?: string
  allowProduction: boolean
  confirmStaging: boolean
  productionHosts: string[]
  requestTimeoutMs: number
  thinkTimeMs: number
  thinkTimeJitterMs: number
  publicFlowMode: 'once' | 'always'
  allowUserReuse: boolean
}

export interface LoadStage {
  name: string
  durationSec: number
  targetVus: number
}

export interface LoadProfile {
  name: LoadProfileName
  maxVus: number
  stages: LoadStage[]
}
