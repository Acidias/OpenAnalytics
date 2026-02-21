import { z } from 'zod';

export const dateRangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
});

export const timeRangeSchema = z.enum(['24h', '7d', '30d', '90d', '12m', 'custom']);

export const analyticsQuerySchema = z.object({
  site_id: z.string().uuid(),
  date_range: dateRangeSchema,
  time_range: timeRangeSchema.optional(),
  path: z.string().max(500).optional(),
  event: z.string().max(100).optional(),
  country: z.string().length(2).optional(),
  device: z.enum(['mobile', 'tablet', 'desktop']).optional(),
  browser: z.string().max(50).optional(),
  os: z.string().max(50).optional(),
  utm_source: z.string().max(200).optional(),
  utm_medium: z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(200).default(50),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;

export const createSiteSchema = z.object({
  domain: z.string().min(1).max(255),
  name: z.string().max(100).optional(),
});

export const createAutoTrackRuleSchema = z.object({
  name: z.string().min(1).max(100),
  event: z.string().min(1).max(100),
  selector: z.string().min(1).max(500),
  trigger: z.enum(['click', 'submit', 'change', 'focus']).default('click'),
  capture_text: z.boolean().default(false),
  capture_value: z.boolean().default(false),
  properties: z.record(z.unknown()).default({}),
});

export const createFunnelSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  steps: z.array(z.object({
    position: z.number().int().min(1),
    name: z.string().min(1).max(200),
    match_type: z.enum(['pageview', 'event']),
    match_path: z.string().max(500).optional(),
    match_event: z.string().max(100).optional(),
    match_props: z.record(z.unknown()).optional(),
    timeout_ms: z.number().int().min(0).default(1_800_000),
  })).min(2),
});

export const createGoalSchema = z.object({
  name: z.string().min(1).max(200),
  match_type: z.enum(['pageview', 'event']),
  match_path: z.string().max(500).optional(),
  match_event: z.string().max(100).optional(),
  match_props: z.record(z.unknown()).optional(),
});
