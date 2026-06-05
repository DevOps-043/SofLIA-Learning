// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useReadingAudioPlayer } from "../useReadingAudioPlayer";

vi.mock("@/lib/utils/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

function createJsonResponse(body: unknown, status: number = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

class MockAudio extends EventTarget {
  static instances: MockAudio[] = [];

  currentTime = 0;
  duration = 180;
  ended = false;
  paused = true;
  preload = "";
  src = "";

  constructor(src: string) {
    super();
    this.src = src;
    MockAudio.instances.push(this);
  }

  async play() {
    this.paused = false;
    this.dispatchEvent(new Event("play"));
  }

  pause() {
    if (this.paused) return;
    this.paused = true;
    this.dispatchEvent(new Event("pause"));
  }

  load() {
    return undefined;
  }
}

describe("useReadingAudioPlayer", () => {
  const originalAudio = global.Audio;
  const originalFetch = global.fetch;
  const originalSendBeacon = navigator.sendBeacon;

  beforeEach(() => {
    MockAudio.instances = [];
    global.Audio = MockAudio as unknown as typeof Audio;
  });

  afterEach(() => {
    global.Audio = originalAudio;
    global.fetch = originalFetch;
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: originalSendBeacon,
    });
    vi.clearAllMocks();
  });

  it("resumes from stored progress and persists the current position on pagehide", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      createJsonResponse({
        progress: {
          completed: false,
          segmentIndex: 0,
          segmentTimeSeconds: 37.5,
        },
        segments: [
          {
            id: "asset-1",
            segmentIndex: 0,
            url: "/api/audio/asset-1",
          },
        ],
        status: "ready",
      }),
    );
    const sendBeaconMock = vi.fn(() => true);

    global.fetch = fetchMock as unknown as typeof fetch;
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: sendBeaconMock,
    });

    const { result } = renderHook(() =>
      useReadingAudioPlayer({
        language: "es",
        lessonId: "11111111-1111-4111-8111-111111111111",
        organizationId: "22222222-2222-4222-8222-222222222222",
        slug: "curso-demo",
        sourceId: "33333333-3333-4333-8333-333333333333",
        sourceType: "activity_reading",
      }),
    );

    await act(async () => {
      await result.current.toggle();
    });

    const audio = MockAudio.instances[0];

    act(() => {
      audio.dispatchEvent(new Event("loadedmetadata"));
    });

    expect(result.current.currentTime).toBeCloseTo(37.5);
    expect(result.current.status).toBe("playing");

    audio.currentTime = 42.25;

    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });

    expect(sendBeaconMock).toHaveBeenCalledWith(
      "/api/courses/curso-demo/reading-audio/progress",
      expect.any(Blob),
    );

    const payloadBlob = sendBeaconMock.mock.calls[0]?.[1] as Blob;
    await expect(payloadBlob.text()).resolves.toContain('"segmentTimeSeconds":42.25');
  });
});
