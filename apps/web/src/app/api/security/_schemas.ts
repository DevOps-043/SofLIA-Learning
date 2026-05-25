import { z } from 'zod';

export const agentHandshakeSchema = z.object({
  agentId: z.string().min(1).max(128).optional(),
  method: z.string().min(1).max(16).optional(),
  pathname: z.string().min(1).max(2_048).optional(),
}).passthrough();

export const automationSignalSchema = z.object({
  cdcArtifacts: z.number().finite().min(0).max(1_000).optional(),
  emptyLanguages: z.boolean().optional(),
  emptyPlugins: z.boolean().optional(),
  headlessBrand: z.boolean().optional(),
  headlessUa: z.boolean().optional(),
  path: z.string().max(2_048).optional(),
  playwright: z.boolean().optional(),
  selenium: z.boolean().optional(),
  webdriver: z.boolean().optional(),
}).passthrough();

export const cspReportSchema = z.record(z.string(), z.unknown());

export type AgentHandshakeBody = z.infer<typeof agentHandshakeSchema>;
export type AutomationSignalBody = z.infer<typeof automationSignalSchema>;
export type CspReportBody = z.infer<typeof cspReportSchema>;
