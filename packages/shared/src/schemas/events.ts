import { z } from 'zod';

/** Validates the raw tracker payload (POST /api/event) */
export const trackerPayloadSchema = z.object({
  s: z.string().min(1).max(12),
  sid: z.string().min(1).max(50),
  t: z.string().min(1).max(100),
  u: z.string().max(500),
  r: z.string().max(500).nullable(),
  w: z.number().int().min(0).max(10000),
  ts: z.number().int().positive(),
  tk: z.string().min(1).max(24).optional(),
  tsg: z.string().min(16).max(128).optional(),
  p: z.record(z.unknown()).optional(),
});

export type TrackerPayloadInput = z.infer<typeof trackerPayloadSchema>;

/** Schema for pageleave properties */
export const pageleavePropsSchema = z.object({
  duration_ms: z.number().int().min(0),
  scroll_max_pct: z.number().int().min(0).max(100),
  engaged: z.boolean(),
});

/** Schema for heartbeat properties */
export const heartbeatPropsSchema = z.object({
  duration_ms: z.number().int().min(0),
  scroll_pct: z.number().int().min(0).max(100),
  engaged: z.boolean(),
});

/** Schema for engage properties */
export const engagePropsSchema = z.object({
  after_ms: z.number().int().min(0),
});

/** Schema for outbound_click properties */
export const outboundClickPropsSchema = z.object({
  url: z.string().url().max(2000),
  text: z.string().max(100),
});
