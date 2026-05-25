export function getStorageDirectory(storagePath: string): string {
  const normalized = storagePath.replace(/\\/g, '/');
  const lastSlashIndex = normalized.lastIndexOf('/');
  return lastSlashIndex >= 0 ? normalized.slice(0, lastSlashIndex) : '';
}

export function getStorageBasename(storagePath: string): string {
  const normalized = storagePath.replace(/\\/g, '/');
  const lastSlashIndex = normalized.lastIndexOf('/');
  return lastSlashIndex >= 0 ? normalized.slice(lastSlashIndex + 1) : normalized;
}

export function stripExtension(fileName: string): string {
  const extensionIndex = fileName.lastIndexOf('.');
  return extensionIndex >= 0 ? fileName.slice(0, extensionIndex) : fileName;
}

export function joinStoragePath(...parts: string[]): string {
  return parts
    .map((part) => part.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
}
