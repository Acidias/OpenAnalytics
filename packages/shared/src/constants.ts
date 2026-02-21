// Device breakpoints (viewport width)
export const DEVICE_BREAKPOINTS = {
  mobile: { max: 767 },
  tablet: { min: 768, max: 1023 },
  desktop: { min: 1024 },
} as const;

export function classifyDevice(viewportWidth: number): 'mobile' | 'tablet' | 'desktop' {
  if (viewportWidth < 768) return 'mobile';
  if (viewportWidth < 1024) return 'tablet';
  return 'desktop';
}

// Event limits
export const EVENT_NAME_MAX_LENGTH = 100;
export const PATH_MAX_LENGTH = 500;
export const REFERRER_MAX_LENGTH = 500;
export const PROPERTY_KEY_MAX_LENGTH = 100;
export const PROPERTY_VALUE_MAX_LENGTH = 500;
export const LINK_TEXT_MAX_LENGTH = 100;
export const CAPTURE_TEXT_MAX_LENGTH = 200;

// Session
export const SESSION_ID_LENGTH = 50;

// Heartbeat
export const HEARTBEAT_INTERVAL_MS = 30_000;
export const HEARTBEAT_DEDUP_MS = 25_000;

// Rate limits
export const RATE_LIMIT_PER_SITE = 200; // events/second
export const RATE_LIMIT_PER_IP = 60;    // events/minute

// Pagination
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

// Config cache
export const CONFIG_CACHE_TTL_SECONDS = 300; // 5 minutes

// Engagement
export const ENGAGEMENT_THRESHOLD_MS = 5_000;

// Funnel defaults
export const DEFAULT_FUNNEL_STEP_TIMEOUT_MS = 1_800_000; // 30 minutes

// Plans
export const PLAN_LIMITS = {
  free: { events_per_month: 10_000 },
  pro: { events_per_month: 1_000_000 },
  enterprise: { events_per_month: 10_000_000 },
} as const;
