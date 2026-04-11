import type { LiaImageAttachment } from './report-problem.contract';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

function readImageDimensions(dataUrl: string): Promise<{
  width: number | null;
  height: number | null;
}> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => {
      resolve({
        width: null,
        height: null,
      });
    };
    image.src = dataUrl;
  });
}

export async function buildLiaImageAttachment(
  file: File
): Promise<LiaImageAttachment> {
  const dataUrl = await readFileAsDataUrl(file);
  const dimensions = await readImageDimensions(dataUrl);

  return {
    kind: 'image',
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
    dataUrl,
    width: dimensions.width,
    height: dimensions.height,
  };
}
