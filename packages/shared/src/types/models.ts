export type Plan = 'free' | 'pro' | 'enterprise';

export interface User {
  id: string;
  email: string;
  name: string | null;
  plan: Plan;
  created_at: string;
}

export interface Site {
  id: string;
  user_id: string;
  domain: string;
  name: string | null;
  public_id: string;
  settings: Record<string, unknown>;
  created_at: string;
}
