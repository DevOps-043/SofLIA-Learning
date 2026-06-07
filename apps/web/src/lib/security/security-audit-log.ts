import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/lib/supabase/types'
import { logger } from '@/lib/logger'

export type SecurityAuditResult = 'success' | 'denied' | 'error'

export interface SecurityAuditLogInput {
  action: string
  result: SecurityAuditResult
  actorId?: string | null
  actorRole?: string | null
  resourceType?: string | null
  resourceId?: string | null
  ip?: string | null
  userAgent?: string | null
  orgId?: string | null
  metadata?: Record<string, unknown>
}

const SENSITIVE_METADATA_KEYS = [
  'authorization',
  'cookie',
  'email',
  'password',
  'secret',
  'token',
] as const

type SecurityAuditLogInsert = {
  action: string
  actor_id: string | null
  actor_role: string | null
  resource_type: string | null
  resource_id: string | null
  ip: string | null
  user_agent: string | null
  org_id: string | null
  result: SecurityAuditResult
  metadata: Json
}

type SecurityAuditLogClient = {
  from(table: 'security_audit_log'): {
    insert(payload: SecurityAuditLogInsert): PromiseLike<{
      error: { message: string } | null
    }>
  }
}

export async function writeSecurityAuditLog(input: SecurityAuditLogInput) {
  const supabase = createAdminClient()
  const payload: SecurityAuditLogInsert = {
    action: input.action,
    actor_id: input.actorId ?? null,
    actor_role: input.actorRole ?? null,
    resource_type: input.resourceType ?? null,
    resource_id: input.resourceId ?? null,
    ip: normalizeIp(input.ip) ?? null,
    user_agent: truncate(input.userAgent, 500),
    org_id: input.orgId ?? null,
    result: input.result,
    metadata: sanitizeAuditMetadata(input.metadata ?? {}),
  }

  const { error } = await (supabase as unknown as SecurityAuditLogClient)
    .from('security_audit_log')
    .insert(payload)
  if (error) {
    logger.warn('Security audit log insert failed', {
      action: input.action,
      result: input.result,
      error: error.message,
    })
  }
}

export function writeSecurityAuditLogAsync(input: SecurityAuditLogInput) {
  void writeSecurityAuditLog(input).catch((error) => {
    logger.warn('Security audit log write skipped', {
      action: input.action,
      error: error instanceof Error ? error.message : String(error),
    })
  })
}

function sanitizeAuditMetadata(value: Record<string, unknown>): Json {
  return sanitizeJsonValue(value) ?? {}
}

function sanitizeJsonValue(value: unknown): Json | undefined {
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
    return undefined
  }

  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => sanitizeJsonValue(entry))
      .filter((entry): entry is Json => entry !== undefined)
  }

  if (typeof value === 'object') {
    return Object.entries(value).reduce<Record<string, Json>>((metadata, [key, entry]) => {
      if (isSensitiveMetadataKey(key)) {
        metadata[key] = '[redacted]'
        return metadata
      }

      const sanitized = sanitizeJsonValue(entry)
      if (sanitized !== undefined) {
        metadata[key] = sanitized
      }
      return metadata
    }, {})
  }

  return String(value)
}

function isSensitiveMetadataKey(key: string) {
  const normalized = key.toLowerCase()
  return SENSITIVE_METADATA_KEYS.some((sensitiveKey) => normalized.includes(sensitiveKey))
}

function normalizeIp(ip?: string | null) {
  return ip?.split(',')[0]?.trim() || undefined
}

function truncate(value: string | null | undefined, maxLength: number) {
  if (!value) return null
  return value.length > maxLength ? value.slice(0, maxLength) : value
}
