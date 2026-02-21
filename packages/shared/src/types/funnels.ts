export interface Funnel {
  id: string;
  site_id: string;
  name: string;
  description: string | null;
  steps: FunnelStep[];
  created_at: string;
}

export interface FunnelStep {
  id: string;
  funnel_id: string;
  position: number;
  name: string;
  match_type: 'pageview' | 'event';
  match_path: string | null;
  match_event: string | null;
  match_props: Record<string, unknown> | null;
  timeout_ms: number;
}

export interface FunnelConversion {
  step_position: number;
  step_name: string;
  count: number;
  conversion_rate: number; // percentage from previous step
  avg_time_to_next_seconds: number | null;
}

export interface FunnelResult {
  funnel: Funnel;
  conversions: FunnelConversion[];
  overall_conversion_pct: number;
  date_range: { from: string; to: string };
}

/** @deprecated Use FunnelResult instead */
export type FunnelAnalysis = FunnelResult;
