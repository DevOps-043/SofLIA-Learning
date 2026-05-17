import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { calculateVariantWidth } from './renditions';
import type { AdaptiveVideoVariant, HlsRendition, VideoStreamInfo } from './types';

export async function writeMasterPlaylist({
  outputRoot,
  renditions,
  stream,
}: {
  outputRoot: string;
  renditions: HlsRendition[];
  stream: VideoStreamInfo;
}): Promise<AdaptiveVideoVariant[]> {
  const variants = renditions.map((rendition) => {
    const width = calculateVariantWidth(stream, rendition.height);
    return {
      bandwidth: rendition.bandwidth,
      height: rendition.height,
      path: `${rendition.name}/index.m3u8`,
      width,
    };
  });
  const manifest = [
    '#EXTM3U',
    '#EXT-X-VERSION:3',
    ...variants.flatMap((variant) => [
      `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bandwidth},RESOLUTION=${variant.width}x${variant.height}`,
      variant.path,
    ]),
    '',
  ].join('\n');

  await writeFile(path.join(outputRoot, 'master.m3u8'), manifest, 'utf8');
  return variants;
}
