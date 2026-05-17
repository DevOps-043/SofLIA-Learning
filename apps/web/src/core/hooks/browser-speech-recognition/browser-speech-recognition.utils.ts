import type { BrowserSpeechRecognition } from "./browser-speech-recognition.types";

export function stopSpeechRecognitionSafely(
  recognition: BrowserSpeechRecognition,
) {
  try {
    recognition.stop();
  } catch {
    // Browser SpeechRecognition can throw when stop races with cleanup.
  }
}
