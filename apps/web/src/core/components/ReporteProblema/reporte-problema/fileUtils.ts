export function validateScreenshotFile(file: File) {
  if (!file.type.startsWith('image/')) return 'Por favor selecciona un archivo de imagen valido';
  if (file.size > 10 * 1024 * 1024) return 'La imagen es demasiado grande. Maximo 10MB';
  return null;
}

export function readFileAsDataUrl(file: File) {
  const reader = new FileReader();
  return new Promise<string>((resolve, reject) => {
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
