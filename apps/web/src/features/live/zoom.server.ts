import "server-only";
import { LiveError } from "./errors";
import { fetchWithCircuitBreaker } from "@/lib/resilience/circuit-breaker";

function env(key: string) {
  const value = process.env[key];
  if (!value) throw new LiveError(503, `Configura ${key} para activar Zoom`);
  return value;
}
export async function zoomRequest(
  path: string,
  method = "GET",
  body?: unknown,
) {
  const token = await zoomAccessToken();
  const response = await fetchWithCircuitBreaker(
    "zoom-api",
    `https://api.zoom.us/v2${path}`,
    {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store", signal: AbortSignal.timeout(20000),
    },
  );
  if (!response.ok) {
    if (response.status === 401) cachedToken = null;
    throw new LiveError(502, "Zoom rechazó la operación. Revisa la cuenta del anfitrión y sus permisos.");
  }
  return response.status === 204 ? null : response.json();
}

let cachedToken: { value: string; expiresAt: number } | null = null;
let tokenInFlight: Promise<string> | null = null;

/** Una clase comparte token administrativo; no solicita OAuth por cada alumno. */
async function zoomAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  if (tokenInFlight) return tokenInFlight;
  tokenInFlight = requestZoomAccessToken();
  try { return await tokenInFlight; }
  finally { tokenInFlight = null; }
}

async function requestZoomAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${env("ZOOM_CLIENT_ID")}:${env("ZOOM_CLIENT_SECRET")}`,
  ).toString("base64");
  const tokenResponse = await fetchWithCircuitBreaker(
    "zoom-oauth",
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(env("ZOOM_ACCOUNT_ID"))}`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${credentials}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!tokenResponse.ok)
    throw new LiveError(502, "No fue posible autenticar la cuenta de Zoom");
  const token = await tokenResponse.json();
  if (typeof token.access_token !== "string" || !token.access_token || !Number.isFinite(token.expires_in) || token.expires_in <= 0)
    throw new LiveError(502, "Zoom no devolvió un token administrativo válido");
  cachedToken = { value: token.access_token, expiresAt: Date.now() + Math.max(0, token.expires_in - 60) * 1000 };
  return token.access_token;
}
