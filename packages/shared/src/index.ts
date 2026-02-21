// Types
export type {
  TrackingEvent,
  TrackerPayload,
  EventType,
  PageviewEvent,
  PageleaveEvent,
  HeartbeatEvent,
  EngageEvent,
  OutboundClickEvent,
  CustomEvent,
} from './types/events.js';

export type {
  Session,
  SessionEvent,
  SessionTimeline,
} from './types/sessions.js';

export type {
  DateRange,
  TimeRange,
  PageStats,
  SiteOverview,
  ReferrerStats,
  GeoStats,
  DeviceStats,
} from './types/analytics.js';

export type {
  Funnel,
  FunnelStep,
  FunnelConversion,
  FunnelResult,
  FunnelAnalysis,
} from './types/funnels.js';

export type {
  Goal,
  GoalCompletion,
  GoalStats,
} from './types/goals.js';

export type {
  AutoTrackRule,
  SiteConfig,
  SiteConfigAutoTrackRule,
} from './types/autotrack.js';

export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  AnalyticsQuery,
} from './types/api.js';

export type {
  User,
  Site,
  Plan,
} from './types/models.js';

// Schemas
export {
  trackerPayloadSchema,
  pageleavePropsSchema,
  heartbeatPropsSchema,
  engagePropsSchema,
  outboundClickPropsSchema,
} from './schemas/events.js';
export type { TrackerPayloadInput } from './schemas/events.js';

export {
  dateRangeSchema,
  timeRangeSchema,
  analyticsQuerySchema,
  createSiteSchema,
  createAutoTrackRuleSchema,
  createFunnelSchema,
  createGoalSchema,
} from './schemas/api.js';
export type { AnalyticsQueryInput } from './schemas/api.js';

// Constants
export {
  DEVICE_BREAKPOINTS,
  classifyDevice,
  EVENT_NAME_MAX_LENGTH,
  PATH_MAX_LENGTH,
  REFERRER_MAX_LENGTH,
  PROPERTY_KEY_MAX_LENGTH,
  PROPERTY_VALUE_MAX_LENGTH,
  LINK_TEXT_MAX_LENGTH,
  CAPTURE_TEXT_MAX_LENGTH,
  SESSION_ID_LENGTH,
  HEARTBEAT_INTERVAL_MS,
  HEARTBEAT_DEDUP_MS,
  RATE_LIMIT_PER_SITE,
  RATE_LIMIT_PER_IP,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  CONFIG_CACHE_TTL_SECONDS,
  ENGAGEMENT_THRESHOLD_MS,
  DEFAULT_FUNNEL_STEP_TIMEOUT_MS,
  PLAN_LIMITS,
} from './constants.js';
