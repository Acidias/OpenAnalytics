export interface Session {
  site_id: string;
  session_id: string;
  started_at: string;
  ended_at: string;
  duration_ms: number;
  page_count: number;
  pages_visited: string[];
  entry_page: string;
  exit_page: string;
  referrer: string | null;
  country: string | null;
  device: 'mobile' | 'tablet' | 'desktop' | null;
  browser: string | null;
  utm_source: string | null;
  was_engaged: boolean;
  max_scroll_pct: number | null;
}

export interface SessionEvent {
  time: string;
  event: string;
  path: string | null;
  properties: Record<string, unknown> | null;
  duration_ms: number | null;
  scroll_max_pct: number | null;
  engaged: boolean | null;
}

export interface SessionTimeline {
  session: Session;
  events: SessionEvent[];
}
