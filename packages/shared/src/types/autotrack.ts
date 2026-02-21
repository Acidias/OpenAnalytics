export interface AutoTrackRule {
  id: string;
  site_id: string;
  name: string;
  event: string;
  selector: string;
  trigger: 'click' | 'submit' | 'change' | 'focus';
  capture_text: boolean;
  capture_value: boolean;
  properties: Record<string, unknown>;
  enabled: boolean;
  created_at: string;
}

/** Response from GET /api/config/:sitePublicId */
export interface SiteConfig {
  autoTrack: SiteConfigAutoTrackRule[];
}

export interface SiteConfigAutoTrackRule {
  selector: string;
  event: string;
  trigger?: 'click' | 'submit' | 'change' | 'focus';
  captureText?: boolean;
  captureValue?: boolean;
  props?: Record<string, unknown>;
}
