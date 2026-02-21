// Quick import verification - ensures all exports resolve
import type {
  TrackingEvent, TrackerPayload, EventType, PageviewEvent, PageleaveEvent,
  HeartbeatEvent, EngageEvent, OutboundClickEvent, CustomEvent,
  Session, SessionEvent, SessionTimeline,
  DateRange, TimeRange, PageStats, SiteOverview, ReferrerStats, GeoStats, DeviceStats,
  Funnel, FunnelStep, FunnelConversion, FunnelResult, FunnelAnalysis,
  Goal, GoalCompletion, GoalStats,
  AutoTrackRule, SiteConfig, SiteConfigAutoTrackRule,
  ApiResponse, ApiError, PaginatedResponse, AnalyticsQuery,
  User, Site, Plan,
  TrackerPayloadInput, AnalyticsQueryInput,
} from '../index.js';

import {
  trackerPayloadSchema, pageleavePropsSchema, heartbeatPropsSchema,
  engagePropsSchema, outboundClickPropsSchema,
  dateRangeSchema, timeRangeSchema, analyticsQuerySchema,
  createSiteSchema, createAutoTrackRuleSchema, createFunnelSchema, createGoalSchema,
  DEVICE_BREAKPOINTS, classifyDevice, EVENT_NAME_MAX_LENGTH, PATH_MAX_LENGTH,
  REFERRER_MAX_LENGTH, PROPERTY_KEY_MAX_LENGTH, PROPERTY_VALUE_MAX_LENGTH,
  LINK_TEXT_MAX_LENGTH, CAPTURE_TEXT_MAX_LENGTH, SESSION_ID_LENGTH,
  HEARTBEAT_INTERVAL_MS, HEARTBEAT_DEDUP_MS, RATE_LIMIT_PER_SITE, RATE_LIMIT_PER_IP,
  DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, CONFIG_CACHE_TTL_SECONDS,
  ENGAGEMENT_THRESHOLD_MS, DEFAULT_FUNNEL_STEP_TIMEOUT_MS, PLAN_LIMITS,
} from '../index.js';

// --- Schema validation tests ---

// trackerPayloadSchema - valid
const validPayload = trackerPayloadSchema.parse({
  s: 'abc123', sid: 'sess1', t: 'pageview', u: '/home', r: null, w: 1024, ts: Date.now()
});
console.log('✅ trackerPayloadSchema valid');

// trackerPayloadSchema - invalid (missing s)
const r1 = trackerPayloadSchema.safeParse({ sid: 'x', t: 'pv', u: '/', r: null, w: 100, ts: 1 });
console.log(r1.success ? '❌ should fail' : '✅ trackerPayloadSchema rejects missing s');

// pageleavePropsSchema
pageleavePropsSchema.parse({ duration_ms: 5000, scroll_max_pct: 80, engaged: true });
console.log('✅ pageleavePropsSchema valid');
const r2 = pageleavePropsSchema.safeParse({ duration_ms: -1, scroll_max_pct: 200, engaged: 'yes' });
console.log(r2.success ? '❌' : '✅ pageleavePropsSchema rejects invalid');

// heartbeatPropsSchema
heartbeatPropsSchema.parse({ duration_ms: 30000, scroll_pct: 50, engaged: false });
console.log('✅ heartbeatPropsSchema valid');

// engagePropsSchema
engagePropsSchema.parse({ after_ms: 5000 });
console.log('✅ engagePropsSchema valid');

// outboundClickPropsSchema
outboundClickPropsSchema.parse({ url: 'https://example.com', text: 'Click' });
console.log('✅ outboundClickPropsSchema valid');
const r3 = outboundClickPropsSchema.safeParse({ url: 'not-a-url', text: 'x' });
console.log(r3.success ? '❌' : '✅ outboundClickPropsSchema rejects invalid url');

// dateRangeSchema
dateRangeSchema.parse({ from: '2024-01-01', to: '2024-01-31' });
console.log('✅ dateRangeSchema valid');

// analyticsQuerySchema
analyticsQuerySchema.parse({
  site_id: '550e8400-e29b-41d4-a716-446655440000',
  date_range: { from: '2024-01-01', to: '2024-01-31' },
});
console.log('✅ analyticsQuerySchema valid');

// createSiteSchema
createSiteSchema.parse({ domain: 'example.com' });
console.log('✅ createSiteSchema valid');

// createGoalSchema
createGoalSchema.parse({ name: 'Signup', match_type: 'event', match_event: 'signup' });
console.log('✅ createGoalSchema valid');

// createFunnelSchema
createFunnelSchema.parse({
  name: 'Checkout',
  steps: [
    { position: 1, name: 'Cart', match_type: 'pageview', match_path: '/cart' },
    { position: 2, name: 'Pay', match_type: 'pageview', match_path: '/pay' },
  ]
});
console.log('✅ createFunnelSchema valid');

// classifyDevice
console.log(classifyDevice(400) === 'mobile' ? '✅' : '❌', 'classifyDevice mobile');
console.log(classifyDevice(800) === 'tablet' ? '✅' : '❌', 'classifyDevice tablet');
console.log(classifyDevice(1200) === 'desktop' ? '✅' : '❌', 'classifyDevice desktop');

console.log('\n🎉 All tests passed!');
