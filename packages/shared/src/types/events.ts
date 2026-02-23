/** Base tracking event matching the unified events table */
export interface TrackingEvent {
  time: string;
  site_id: string;
  session_id: string;
  event: string;
  path: string | null;
  referrer: string | null;

  // Behavioral (auto-tracked)
  duration_ms: number | null;
  scroll_max_pct: number | null;
  engaged: boolean | null;

  // Context (server-extracted)
  country: string | null;
  region: string | null;
  city: string | null;
  device: 'mobile' | 'tablet' | 'desktop' | null;
  browser: string | null;
  os: string | null;

  // UTM
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;

  // Custom
  properties: Record<string, unknown> | null;
  value: number | null;

  // Performance
  load_time_ms: number | null;
}

/** Raw event payload sent by the tracker script */
export interface TrackerPayload {
  /** Site public ID */
  s: string;
  /** Session ID */
  sid: string;
  /** Event type */
  t: string;
  /** URL path + search */
  u: string;
  /** Referrer */
  r: string | null;
  /** Viewport width */
  w: number;
  /** Client timestamp */
  ts: number;
  /** Ingestion token public ID */
  tk?: string;
  /** HMAC signature generated from token secret */
  tsg?: string;
  /** Event properties */
  p?: Record<string, unknown>;
}

export type EventType =
  | 'pageview'
  | 'pageleave'
  | 'heartbeat'
  | 'engage'
  | 'outbound_click'
  | string; // custom events

export interface PageviewEvent extends TrackingEvent {
  event: 'pageview';
}

export interface PageleaveEvent extends TrackingEvent {
  event: 'pageleave';
  duration_ms: number;
  scroll_max_pct: number;
  engaged: boolean;
}

export interface HeartbeatEvent extends TrackingEvent {
  event: 'heartbeat';
  properties: {
    duration_ms: number;
    scroll_pct: number;
    engaged: boolean;
  };
}

export interface EngageEvent extends TrackingEvent {
  event: 'engage';
  properties: {
    after_ms: number;
  };
}

export interface OutboundClickEvent extends TrackingEvent {
  event: 'outbound_click';
  properties: {
    url: string;
    text: string;
  };
}

export interface CustomEvent extends TrackingEvent {
  event: string;
  properties: Record<string, unknown>;
}
