export const isValidFileSize = (fileSize: number, maxSize: number): boolean => {
  return fileSize <= maxSize
}

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export const isValidFileType = (
  mimeType: string,
  allowedTypes: string[],
): boolean => {
  return allowedTypes.includes(mimeType)
}
