import fs from 'node:fs'
import path from 'node:path'

let envFileLoaded = false

function parseEnvLine(line: string) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return undefined

  const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
  if (!match) return undefined

  let value = match[2].trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }

  return { name: match[1], value }
}

function loadEnvFile() {
  if (envFileLoaded) return
  envFileLoaded = true

  const envFile = process.env.LOAD_ENV_FILE || '.env.load-test'
  const envPath = path.resolve(envFile)
  if (!fs.existsSync(envPath)) return

  const raw = fs.readFileSync(envPath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const parsed = parseEnvLine(line)
    if (parsed) process.env[parsed.name] ||= parsed.value
  }
}

export function readEnv(name: string) {
  loadEnvFile()
  const value = process.env[name]
  return value && value.trim().length > 0 ? value.trim() : undefined
}

export function readNumber(name: string, fallback: number) {
  const raw = readEnv(name)
  if (!raw) return fallback

  const value = Number(raw)
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a positive number. Received: ${raw}`)
  }

  return value
}

export function readBoolean(name: string, fallback = false) {
  const raw = readEnv(name)
  if (!raw) return fallback
  return ['1', 'true', 'yes', 'y'].includes(raw.toLowerCase())
}
