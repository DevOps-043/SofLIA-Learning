import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyZoomWebhook(
  rawBody: string,
  timestamp: string | null,
  signature: string | null,
  secret: string,
  now = Date.now(),
): boolean {
  if (!timestamp || !signature || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(now - Number(timestamp) * 1000) > 300000) return false;
  const expected = `v0=${createHmac("sha256", secret).update(`v0:${timestamp}:${rawBody}`).digest("hex")}`;
  const received = Buffer.from(signature);
  const computed = Buffer.from(expected);
  return (
    received.length === computed.length && timingSafeEqual(received, computed)
  );
}
export function zoomChallenge(plainToken: string, secret: string) {
  return {
    plainToken,
    encryptedToken: createHmac("sha256", secret)
      .update(plainToken)
      .digest("hex"),
  };
}
