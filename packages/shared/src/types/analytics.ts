export interface DateRange {
  from: string; // ISO date
  to: string;
}

export type TimeRange = '24h' | '7d' | '30d' | '90d' | '12m' | 'custom';

export interface PageStats {
  path: string;
  views: number;
  unique_visitors: number;
  avg_duration_ms: number;
  avg_scroll_pct: number;
  engagement_rate: number;
  entry_rate: number;
  exit_rate: number;
}

export interface SiteOverview {
  visitors: number;
  pageviews: number;
  avg_duration_ms: number;
  bounce_rate: number;
  avg_scroll_pct: number;
  engagement_rate: number;
  top_pages: PageStats[];
  top_referrers: ReferrerStats[];
  top_countries: GeoStats[];
}

export interface ReferrerStats {
  referrer: string;
  visitors: number;
  pageviews: number;
  avg_duration_ms: number;
  bounce_rate: number;
}

export interface GeoStats {
  country: string;
  region?: string;
  city?: string;
  visitors: number;
  pageviews: number;
}

export interface DeviceStats {
  device: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  visitors: number;
  pageviews: number;
  percentage: number;
}
