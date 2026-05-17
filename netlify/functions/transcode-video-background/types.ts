export interface TranscodeJobPayload {
  bucket: string;
  contentType: string;
  jobId: string;
  sizeBytes?: number;
  sourcePath: string;
  sourceUrl: string;
}

export interface VideoStreamInfo {
  height: number;
  width: number;
}

export interface HlsRendition {
  bandwidth: number;
  bufsize: string;
  height: number;
  maxrate: string;
  name: string;
  videoBitrate: string;
}
