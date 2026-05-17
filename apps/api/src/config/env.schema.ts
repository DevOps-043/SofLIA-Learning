import { z } from 'zod'

const secureOptionalString = (message: string) =>
  z.string().min(32, { message }).optional()

export const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_VERSION: z.string().default('v1'),
  ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:3001'),

  USER_JWT_SECRET: secureOptionalString(
    'USER_JWT_SECRET debe tener al menos 32 caracteres para ser seguro',
  ),
  SUPABASE_JWT_SECRET: secureOptionalString(
    'SUPABASE_JWT_SECRET debe tener al menos 32 caracteres para ser seguro',
  ),
  JWT_SECRET: secureOptionalString(
    'JWT_SECRET debe tener al menos 32 caracteres para ser seguro',
  ),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REFRESH_TOKEN_SECRET: secureOptionalString(
    'REFRESH_TOKEN_SECRET debe tener al menos 32 caracteres',
  ),
  API_SECRET_KEY: secureOptionalString(
    'API_SECRET_KEY debe tener al menos 32 caracteres',
  ),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),

  SUPABASE_URL: z.string().url('SUPABASE_URL debe ser una URL valida').optional(),
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL debe ser una URL valida')
    .optional(),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(20, 'SUPABASE_SERVICE_ROLE_KEY requerida (minimo 20 caracteres)')
    .optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),

  OPENAI_API_KEY: z
    .string()
    .min(20, 'OPENAI_API_KEY debe tener al menos 20 caracteres')
    .optional(),
  CHATBOT_MODEL: z.string().default('gpt-4o-mini'),
  CHATBOT_MAX_TOKENS: z.coerce.number().int().positive().max(4000).default(700),
  CHATBOT_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.6),
  ASSEMBLYAI_API_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  ZOOM_API_KEY: z.string().optional(),
  ZOOM_API_SECRET: z.string().optional(),

  DATABASE_URL: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().email('SMTP_USER debe ser un email valido').optional().or(z.literal('')),
  SMTP_PASS: z.string().optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  AUDIO_ENABLED: z.coerce.boolean().default(false),
  AUDIO_VOLUME: z.coerce.number().min(0).max(1).default(0.7),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  SESSION_SECRET: secureOptionalString(
    'SESSION_SECRET debe tener al menos 32 caracteres',
  ),

  MAX_FILE_SIZE: z.coerce.number().int().positive().default(10485760),
  ALLOWED_FILE_TYPES: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(1000),
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
})

export type ParsedEnv = z.infer<typeof envSchema>
