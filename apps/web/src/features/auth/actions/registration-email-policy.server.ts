import 'server-only'

const BLOCKED_REGISTRATION_DOMAINS = new Set([
  'example.com',
  'example.net',
  'example.org',
  'guerrillamail.com',
  'maildrop.cc',
  'mailinator.com',
  'tempmail.com',
  'yopmail.com',
])

export function validatePublicRegistrationEmail(emailAddress: string) {
  const email = emailAddress.trim().toLowerCase()
  const separator = email.lastIndexOf('@')
  const domain = separator >= 0 ? email.slice(separator + 1) : ''

  if (!domain || BLOCKED_REGISTRATION_DOMAINS.has(domain)) {
    return 'Usa una direccion de correo real y permanente para registrarte.'
  }

  return null
}
