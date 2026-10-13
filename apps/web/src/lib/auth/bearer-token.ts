/** Syntax check only; Supabase Auth still verifies the JWT and its signature. */
export function readJwtBearerToken(authorization: string | null): string | null {
  if (!authorization || authorization.length > 8199) return null
  const match = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(authorization)
  return match?.[1] ?? null
}
