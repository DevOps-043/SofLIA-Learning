export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text || typeof document === 'undefined') {
    return false
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Continue to legacy fallback below.
    }
  }

  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.setAttribute('readonly', 'true')
    textArea.style.position = 'fixed'
    textArea.style.top = '-9999px'
    textArea.style.left = '-9999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    const successfulCopy = document.execCommand('copy')
    document.body.removeChild(textArea)
    return successfulCopy
  } catch {
    return false
  }
}
