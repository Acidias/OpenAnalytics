export interface AISuggestion<T = unknown> {
  id: string;
  description: string;
  data: T;
}

export interface AISuggestResponse {
  funnels: AISuggestion[];
  goals: AISuggestion[];
  rules: AISuggestion[];
  context: {
    total_pages: number;
    total_events: number;
    crawled: boolean;
  };
}
