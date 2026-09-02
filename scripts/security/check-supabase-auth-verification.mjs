const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !anonKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
  )
  process.exit(2)
}

const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
  headers: { apikey: anonKey },
  signal: AbortSignal.timeout(10_000),
})

if (!response.ok) {
  console.error(
    `Could not read Supabase Auth settings (HTTP ${response.status}).`,
  )
  process.exit(2)
}

const settings = await response.json()
const disableSignup = settings.disable_signup ?? settings.disableSignup
const mailerAutoconfirm =
  settings.mailer_autoconfirm ?? settings.mailerAutoconfirm

const violations = []
if (disableSignup !== true) {
  violations.push(
    'Direct Supabase Auth signup is enabled; expected disable_signup=true.',
  )
}
if (mailerAutoconfirm !== false) {
  violations.push(
    'Email auto-confirmation is enabled; expected mailer_autoconfirm=false.',
  )
}

if (violations.length > 0) {
  console.error('Unsafe Supabase Auth verification configuration:')
  for (const violation of violations) console.error(`- ${violation}`)
  process.exit(1)
}

console.log('Supabase Auth verification configuration is secure.')
