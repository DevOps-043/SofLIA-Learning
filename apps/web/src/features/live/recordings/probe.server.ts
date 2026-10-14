import "server-only";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { z } from "zod";
const execute = promisify(execFile);
const probeSchema = z.object({
  format: z.object({
    duration: z.coerce.number().positive().max(86400),
    format_name: z.string(),
  }),
  streams: z.array(
    z.object({ codec_type: z.string(), codec_name: z.string().optional() }),
  ),
});
export async function probeRecording(file: string, signal: AbortSignal) {
  const result = await execute(
    process.env.RECORDING_FFPROBE_PATH || "ffprobe",
    [
      "-v",
      "error",
      "-protocol_whitelist",
      "file,pipe",
      "-probesize",
      "10000000",
      "-analyzeduration",
      "10000000",
      "-show_format",
      "-show_streams",
      "-of",
      "json",
      file,
    ],
    { timeout: 30000, maxBuffer: 256 * 1024, signal, windowsHide: true },
  );
  const data = probeSchema.parse(JSON.parse(result.stdout));
  if (
    !data.format.format_name.includes("mp4") ||
    !data.streams.some((s) => s.codec_type === "video") ||
    !data.streams.some((s) => s.codec_type === "audio")
  )
    throw new Error("El webinar no contiene vídeo y audio reproducibles.");
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file, { signal })) {
    signal.throwIfAborted();
    hash.update(chunk);
  }
  return { duration: data.format.duration, sha256: hash.digest("hex") };
}
