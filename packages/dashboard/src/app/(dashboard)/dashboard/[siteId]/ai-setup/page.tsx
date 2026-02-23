"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  Sparkles, Target, Layers, MousePointerClick, Check, Loader2, ChevronRight,
} from "lucide-react";
interface AISuggestion<T = unknown> {
  id: string;
  description: string;
  data: T;
}

interface AISuggestResponse {
  funnels: AISuggestion[];
  goals: AISuggestion[];
  rules: AISuggestion[];
  context: {
    total_pages: number;
    total_events: number;
    crawled: boolean;
  };
}

interface FunnelStep {
  position: number;
  name: string;
  match_type: string;
  match_path?: string;
  match_event?: string;
}

interface FunnelData {
  name: string;
  description?: string;
  steps: FunnelStep[];
}

interface GoalData {
  name: string;
  match_type: string;
  match_path?: string;
  match_event?: string;
}

interface RuleData {
  name: string;
  event: string;
  selector: string;
  trigger?: string;
  capture_text?: boolean;
  capture_value?: boolean;
}

export default function AISetupPage() {
  const { siteId } = useParams();
  const [description, setDescription] = useState("");
  const [crawl, setCrawl] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestResponse | null>(null);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState<Set<string>>(new Set());

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setSuggestions(null);
    setAccepted(new Set());
    try {
      const result = await api.ai.suggest(siteId as string, {
        description: description || undefined,
        crawl,
      });
      setSuggestions(result as AISuggestResponse);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.includes("503")
            ? "AI features require an Anthropic API key. Ask your administrator to set ANTHROPIC_API_KEY."
            : err.message.includes("400")
              ? "Not enough context to generate suggestions. Add a site description or collect some analytics data first."
              : err.message.includes("429")
                ? "AI rate limit reached. Please try again in a moment."
                : "Failed to generate suggestions. Please try again."
          : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptFunnel(suggestion: AISuggestion<FunnelData>) {
    setAdding((prev) => new Set(prev).add(suggestion.id));
    try {
      await api.funnels.create(siteId as string, suggestion.data as unknown as Record<string, unknown>);
      setAccepted((prev) => new Set(prev).add(suggestion.id));
    } catch {
      setError(`Failed to add funnel "${suggestion.data.name}".`);
    } finally {
      setAdding((prev) => {
        const next = new Set(prev);
        next.delete(suggestion.id);
        return next;
      });
    }
  }

  async function handleAcceptGoal(suggestion: AISuggestion<GoalData>) {
    setAdding((prev) => new Set(prev).add(suggestion.id));
    try {
      await api.goals.create(siteId as string, suggestion.data as unknown as Record<string, unknown>);
      setAccepted((prev) => new Set(prev).add(suggestion.id));
    } catch {
      setError(`Failed to add goal "${suggestion.data.name}".`);
    } finally {
      setAdding((prev) => {
        const next = new Set(prev);
        next.delete(suggestion.id);
        return next;
      });
    }
  }

  async function handleAcceptRule(suggestion: AISuggestion<RuleData>) {
    setAdding((prev) => new Set(prev).add(suggestion.id));
    try {
      await api.rules.create(siteId as string, suggestion.data as unknown as Record<string, unknown>);
      setAccepted((prev) => new Set(prev).add(suggestion.id));
    } catch {
      setError(`Failed to add rule "${suggestion.data.name}".`);
    } finally {
      setAdding((prev) => {
        const next = new Set(prev);
        next.delete(suggestion.id);
        return next;
      });
    }
  }

  const totalSuggestions = suggestions
    ? suggestions.funnels.length + suggestions.goals.length + suggestions.rules.length
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Setup Assistant
        </h1>
        <p className="text-muted-foreground mt-1">
          Let AI analyse your site and suggest tracking configuration
        </p>
      </div>

      {/* Input section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Describe your site</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="e.g. SaaS product with pricing page, signup flow, and documentation. Key conversions are free trial signups and demo requests..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={crawl}
                onChange={(e) => setCrawl(e.target.checked)}
                disabled={loading}
                className="rounded border-input"
              />
              Crawl homepage for page structure
            </label>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analysing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Suggestions
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}

      {/* Results */}
      {suggestions && totalSuggestions === 0 && (
        <p className="text-muted-foreground">
          No suggestions could be generated. Try adding a more detailed description of your site
          and what conversions matter to you.
        </p>
      )}

      {suggestions && suggestions.funnels.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" />
            Suggested Funnels ({suggestions.funnels.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {(suggestions.funnels as AISuggestion<FunnelData>[]).map((s) => (
              <Card key={s.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">{s.data.name}</CardTitle>
                  <Badge variant="secondary">{s.data.steps.length} steps</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground overflow-x-auto">
                    {s.data.steps.map((step, i) => (
                      <span key={step.position} className="flex items-center gap-1 whitespace-nowrap">
                        <span className="bg-muted px-2 py-0.5 rounded">{step.name}</span>
                        {i < s.data.steps.length - 1 && <ChevronRight className="h-3 w-3 flex-shrink-0" />}
                      </span>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAcceptFunnel(s)}
                    disabled={accepted.has(s.id) || adding.has(s.id)}
                    variant={accepted.has(s.id) ? "outline" : "default"}
                  >
                    {accepted.has(s.id) ? (
                      <><Check className="mr-1 h-3 w-3" /> Added</>
                    ) : adding.has(s.id) ? (
                      <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Adding...</>
                    ) : (
                      "Add to Site"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {suggestions && suggestions.goals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            Suggested Goals ({suggestions.goals.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(suggestions.goals as AISuggestion<GoalData>[]).map((s) => (
              <Card key={s.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">{s.data.name}</CardTitle>
                  <Badge variant="secondary" className="capitalize">{s.data.match_type}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Tracking: <span className="font-mono">{s.data.match_event || s.data.match_path}</span>
                  </p>
                  <Button
                    size="sm"
                    onClick={() => handleAcceptGoal(s)}
                    disabled={accepted.has(s.id) || adding.has(s.id)}
                    variant={accepted.has(s.id) ? "outline" : "default"}
                  >
                    {accepted.has(s.id) ? (
                      <><Check className="mr-1 h-3 w-3" /> Added</>
                    ) : adding.has(s.id) ? (
                      <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Adding...</>
                    ) : (
                      "Add to Site"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {suggestions && suggestions.rules.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MousePointerClick className="h-5 w-5 text-muted-foreground" />
            Suggested Auto-track Rules ({suggestions.rules.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(suggestions.rules as AISuggestion<RuleData>[]).map((s) => (
              <Card key={s.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">{s.data.name}</CardTitle>
                  <Badge variant="secondary" className="capitalize">{s.data.trigger || "click"}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Selector: <span className="font-mono">{s.data.selector}</span></p>
                    <p>Event name: <span className="font-mono">{s.data.event}</span></p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAcceptRule(s)}
                    disabled={accepted.has(s.id) || adding.has(s.id)}
                    variant={accepted.has(s.id) ? "outline" : "default"}
                  >
                    {accepted.has(s.id) ? (
                      <><Check className="mr-1 h-3 w-3" /> Added</>
                    ) : adding.has(s.id) ? (
                      <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Adding...</>
                    ) : (
                      "Add to Site"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Context summary */}
      {suggestions && totalSuggestions > 0 && (
        <p className="text-xs text-muted-foreground">
          Based on {suggestions.context.total_pages} pages and {suggestions.context.total_events} custom events
          from the last 30 days{suggestions.context.crawled ? ", plus homepage crawl data" : ""}.
        </p>
      )}
    </div>
  );
}
