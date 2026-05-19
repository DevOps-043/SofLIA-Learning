import { z } from 'zod';

import {
  DEFAULT_ELEVENLABS_MODEL_ID,
  DEFAULT_TTS_OPTIMIZE_STREAMING_LATENCY,
  DEFAULT_TTS_OUTPUT_FORMAT,
  MAX_TTS_TEXT_LENGTH,
} from '../../../core/services/tts/shared';

export const textToSpeechSchema = z.object({
  text: z.string().trim().min(1).max(MAX_TTS_TEXT_LENGTH),
  voiceId: z.string().trim().min(1).max(128).optional(),
  modelId: z
    .string()
    .trim()
    .min(1)
    .max(128)
    .optional()
    .default(DEFAULT_ELEVENLABS_MODEL_ID),
  voiceSettings: z
    .object({
      stability: z.number().min(0).max(1),
      similarity_boost: z.number().min(0).max(1),
      style: z.number().min(0).max(1),
      use_speaker_boost: z.boolean(),
    })
    .optional(),
  speed: z.number().min(0.5).max(2).optional(),
  optimizeStreamingLatency: z
    .number()
    .int()
    .min(0)
    .max(4)
    .optional()
    .default(DEFAULT_TTS_OPTIMIZE_STREAMING_LATENCY),
  outputFormat: z
    .string()
    .trim()
    .min(1)
    .max(32)
    .optional()
    .default(DEFAULT_TTS_OUTPUT_FORMAT),
});

export type TextToSpeechBody = z.infer<typeof textToSpeechSchema>;
