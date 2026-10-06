// @vitest-environment node
import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifyZoomWebhook, zoomChallenge } from "../zoom-webhook";
describe("Zoom webhook authenticity", () => {
  const secret = "test-only-secret",
    timestamp = "1791216000",
    body = '{"event":"meeting.ended"}';
  const signature = `v0=${createHmac("sha256", secret).update(`v0:${timestamp}:${body}`).digest("hex")}`;
  it("accepts the exact signed body within the replay window", () => {
    expect(
      verifyZoomWebhook(
        body,
        timestamp,
        signature,
        secret,
        Number(timestamp) * 1000,
      ),
    ).toBe(true);
  });
  it("rejects tampering, expired requests, missing and malformed signatures", () => {
    const now = Number(timestamp) * 1000;
    expect(
      verifyZoomWebhook(body + " ", timestamp, signature, secret, now),
    ).toBe(false);
    expect(
      verifyZoomWebhook(body, timestamp, signature, secret, now + 301000),
    ).toBe(false);
    expect(verifyZoomWebhook(body, timestamp, "v0=x", secret, now)).toBe(false);
    expect(verifyZoomWebhook(body, null, null, secret, now)).toBe(false);
    expect(
      verifyZoomWebhook(body, "not-a-number", signature, secret, now),
    ).toBe(false);
  });
  it("returns only the challenge and its HMAC", () => {
    expect(zoomChallenge("challenge", secret)).toEqual({
      plainToken: "challenge",
      encryptedToken: createHmac("sha256", secret)
        .update("challenge")
        .digest("hex"),
    });
  });
});
