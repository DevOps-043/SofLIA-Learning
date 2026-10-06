import "server-only";
import { createHmac } from "node:crypto";
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
  const response = await fetchWithCircuitBreaker(
    "zoom-api",
    `https://api.zoom.us/v2${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    },
  );
  if (!response.ok)
    throw new LiveError(
      502,
      "Zoom rechazó la operación. Revisa la cuenta del anfitrión y sus permisos.",
    );
  return response.status === 204 ? null : response.json();
}
export function meetingSignature(meeting: string, role: 0 | 1) {
  const key = env("ZOOM_MEETING_SDK_KEY"),
    secret = env("ZOOM_MEETING_SDK_SECRET");
  const now = Math.floor(Date.now() / 1000) - 30,
    exp = now + 3600;
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sdkKey: key, appKey: key, mn: meeting, role, iat: now, exp, tokenExp: exp })}`;
  return `${unsigned}.${createHmac("sha256", secret).update(unsigned).digest("base64url")}`;
}
