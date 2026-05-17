import type { BrowserSpeechRecognitionMessages } from "./browser-speech-recognition.types";

export function getMicrophoneNotAllowedMessage(
  messages: BrowserSpeechRecognitionMessages | undefined,
  context: "start" | "retry" = "start",
) {
  if (messages?.notAllowed) {
    return messages.notAllowed;
  }

  return context === "retry"
    ? "Necesito permiso para usar el microfono. Permite el acceso y vuelve a intentar."
    : "Necesito permiso para usar el microfono. Habilita el acceso en tu navegador e intenta de nuevo.";
}

export function getSpeechRecognitionStartErrorMessage(
  messages: BrowserSpeechRecognitionMessages | undefined,
) {
  return messages?.startError || "No pude iniciar el dictado. Intenta nuevamente.";
}

export function getSpeechRecognitionUnsupportedMessage(
  messages: BrowserSpeechRecognitionMessages | undefined,
) {
  return messages?.notSupported || "Tu navegador no soporta reconocimiento de voz. Usa Chrome, Edge o Safari.";
}
