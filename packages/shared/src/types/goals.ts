export interface Goal {
  id: string;
  site_id: string;
  name: string;
  match_type: 'pageview' | 'event';
  match_path: string | null;
  match_event: string | null;
  match_props: Record<string, unknown> | null;
  created_at: string;
}

export interface GoalCompletion {
  goal_id: string;
  session_id: string;
  completed_at: string;
  properties: Record<string, unknown> | null;
}

export interface GoalStats {
  goal: Goal;
  completions: number;
  unique_sessions: number;
  conversion_rate: number;
  trend: number; // percentage change vs previous period
}
