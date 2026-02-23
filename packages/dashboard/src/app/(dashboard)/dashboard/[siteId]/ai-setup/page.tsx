"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import {
  Sparkles,
  Target,
  Layers,
  MousePointerClick,
  Check,
  Loader2,
  SkipForward,
  ArrowRight,
  RotateCcw,
  ExternalLink,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

type SuggestionType = "funnel" | "goal" | "rule";

interface FlatSuggestion {
  type: SuggestionType;
  suggestion: AISuggestion;
  editedData: FunnelData | GoalData | RuleData;
}

type Phase = "describe" | "review" | "done";

interface Results {
  funnels: number;
  goals: number;
  rules: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const typeConfig: Record<SuggestionType, { label: string; icon: typeof Layers; colour: string }> = {
  funnel: { label: "Funnel", icon: Layers, colour: "text-blue-500" },
  goal: { label: "Goal", icon: Target, colour: "text-green-500" },
  rule: { label: "Rule", icon: MousePointerClick, colour: "text-orange-500" },
};

function flattenSuggestions(res: AISuggestResponse): FlatSuggestion[] {
  const flat: FlatSuggestion[] = [];
  for (const s of res.funnels as AISuggestion<FunnelData>[]) {
    flat.push({ type: "funnel", suggestion: s, editedData: structuredClone(s.data) });
  }
  for (const s of res.goals as AISuggestion<GoalData>[]) {
    flat.push({ type: "goal", suggestion: s, editedData: structuredClone(s.data) });
  }
  for (const s of res.rules as AISuggestion<RuleData>[]) {
    flat.push({ type: "rule", suggestion: s, editedData: structuredClone(s.data) });
  }
  return flat;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AISetupPage() {
  const { siteId } = useParams();

  // Phase 1 - Describe
  const [description, setDescription] = useState("");
  const [crawl, setCrawl] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wizard state
  const [phase, setPhase] = useState<Phase>("describe");
  const [allSuggestions, setAllSuggestions] = useState<FlatSuggestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [accepting, setAccepting] = useState(false);
  const [results, setResults] = useState<Results>({ funnels: 0, goals: 0, rules: 0 });

  // ---------------------------------------------------------------------------
  // Phase 1 - Generate suggestions
  // ---------------------------------------------------------------------------

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const result = (await api.ai.suggest(siteId as string, {
        description: description || undefined,
        crawl,
      })) as AISuggestResponse;

      const flat = flattenSuggestions(result);
      if (flat.length === 0) {
        setError(
          "No suggestions could be generated. Try adding a more detailed description of your site and what conversions matter to you."
        );
        return;
      }

      setAllSuggestions(flat);
      setCurrentIndex(0);
      setResults({ funnels: 0, goals: 0, rules: 0 });
      setPhase("review");
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

  // ---------------------------------------------------------------------------
  // Phase 2 - Review helpers
  // ---------------------------------------------------------------------------

  const current = allSuggestions[currentIndex] as FlatSuggestion | undefined;
  const isLast = currentIndex === allSuggestions.length - 1;

  function updateEditedData(updater: (data: FunnelData | GoalData | RuleData) => void) {
    setAllSuggestions((prev) => {
      const next = [...prev];
      const clone = structuredClone(next[currentIndex].editedData);
      updater(clone);
      next[currentIndex] = { ...next[currentIndex], editedData: clone };
      return next;
    });
  }

  function advance() {
    if (isLast) {
      setPhase("done");
    } else {
      setCurrentIndex((i) => i + 1);
    }
    setError(null);
  }

  async function handleAccept() {
    if (!current) return;
    setAccepting(true);
    setError(null);
    try {
      const data = current.editedData as unknown as Record<string, unknown>;
      if (current.type === "funnel") {
        await api.funnels.create(siteId as string, data);
        setResults((r) => ({ ...r, funnels: r.funnels + 1 }));
      } else if (current.type === "goal") {
        await api.goals.create(siteId as string, data);
        setResults((r) => ({ ...r, goals: r.goals + 1 }));
      } else {
        await api.rules.create(siteId as string, data);
        setResults((r) => ({ ...r, rules: r.rules + 1 }));
      }
      advance();
    } catch {
      setError(`Failed to add ${current.type} "${(current.editedData as { name: string }).name}". Please try again.`);
    } finally {
      setAccepting(false);
    }
  }

  function handleSkip() {
    advance();
  }

  function handleStartOver() {
    setPhase("describe");
    setAllSuggestions([]);
    setCurrentIndex(0);
    setResults({ funnels: 0, goals: 0, rules: 0 });
    setError(null);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

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

      {/* Phase 1 - Describe */}
      {phase === "describe" && (
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
      )}

      {/* Phase 2 - Review */}
      {phase === "review" && current && (
        <>
          {/* Progress header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Suggestion {currentIndex + 1} of {allSuggestions.length}
              </span>
              <span>{Math.round(((currentIndex + 1) / allSuggestions.length) * 100)}%</span>
            </div>
            <Progress value={((currentIndex + 1) / allSuggestions.length) * 100} className="h-2" />
          </div>

          {/* Suggestion card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                {(() => {
                  const cfg = typeConfig[current.type];
                  const Icon = cfg.icon;
                  return (
                    <>
                      <Icon className={`h-5 w-5 ${cfg.colour}`} />
                      <Badge variant="secondary">{cfg.label}</Badge>
                    </>
                  );
                })()}
              </div>
              <CardTitle className="text-xl mt-2">
                {(current.editedData as { name: string }).name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{current.suggestion.description}</p>
            </CardHeader>

            <CardContent className="space-y-6">
              <Separator />

              {/* Funnel fields */}
              {current.type === "funnel" && (
                <FunnelEditor
                  data={current.editedData as FunnelData}
                  onChange={(updater) => updateEditedData((d) => updater(d as FunnelData))}
                />
              )}

              {/* Goal fields */}
              {current.type === "goal" && (
                <GoalEditor
                  data={current.editedData as GoalData}
                  onChange={(updater) => updateEditedData((d) => updater(d as GoalData))}
                />
              )}

              {/* Rule fields */}
              {current.type === "rule" && (
                <RuleEditor
                  data={current.editedData as RuleData}
                  onChange={(updater) => updateEditedData((d) => updater(d as RuleData))}
                />
              )}

              {/* Actions */}
              <Separator />
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={handleSkip} disabled={accepting}>
                  <SkipForward className="mr-2 h-4 w-4" />
                  {isLast ? "Skip & Finish" : "Skip"}
                </Button>
                <Button onClick={handleAccept} disabled={accepting}>
                  {accepting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      {isLast ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Accept & Finish
                        </>
                      ) : (
                        <>
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Accept & Next
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Phase 3 - Done */}
      {phase === "done" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Check className="h-6 w-6 text-green-500" />
              <CardTitle className="text-xl">Setup Complete</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {results.funnels + results.goals + results.rules === 0 ? (
              <p className="text-muted-foreground">
                No suggestions were accepted. You can start over to try again with a different description.
              </p>
            ) : (
              <>
                <p className="text-muted-foreground">
                  Successfully added {results.funnels + results.goals + results.rules} item
                  {results.funnels + results.goals + results.rules !== 1 ? "s" : ""} to your site:
                </p>
                <div className="space-y-2">
                  {results.funnels > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Layers className="h-4 w-4 text-blue-500" />
                      <span>
                        {results.funnels} Funnel{results.funnels !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                  {results.goals > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="h-4 w-4 text-green-500" />
                      <span>
                        {results.goals} Goal{results.goals !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                  {results.rules > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <MousePointerClick className="h-4 w-4 text-orange-500" />
                      <span>
                        {results.rules} Rule{results.rules !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator />

            <div className="flex flex-wrap gap-3">
              {results.funnels > 0 && (
                <Button variant="outline" asChild>
                  <a href={`/dashboard/${siteId}/funnels`}>
                    <Layers className="mr-2 h-4 w-4" />
                    View Funnels
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              )}
              {results.goals > 0 && (
                <Button variant="outline" asChild>
                  <a href={`/dashboard/${siteId}/goals`}>
                    <Target className="mr-2 h-4 w-4" />
                    View Goals
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              )}
              {results.rules > 0 && (
                <Button variant="outline" asChild>
                  <a href={`/dashboard/${siteId}/devices`}>
                    <MousePointerClick className="mr-2 h-4 w-4" />
                    View Auto-track Rules
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              )}
              <Button onClick={handleStartOver}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Start Over
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error display */}
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline editors for each suggestion type
// ---------------------------------------------------------------------------

function FunnelEditor({
  data,
  onChange,
}: {
  data: FunnelData;
  onChange: (updater: (d: FunnelData) => void) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="funnel-name">Name</Label>
        <Input
          id="funnel-name"
          value={data.name}
          onChange={(e) => onChange((d) => { d.name = e.target.value; })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="funnel-description">Description</Label>
        <Input
          id="funnel-description"
          value={data.description || ""}
          onChange={(e) => onChange((d) => { d.description = e.target.value || undefined; })}
          placeholder="Optional description"
        />
      </div>
      <div className="space-y-2">
        <Label>Steps</Label>
        <div className="space-y-2">
          {data.steps.map((step, i) => (
            <div
              key={step.position}
              className="flex items-center gap-2 rounded-md border border-input bg-muted/50 px-3 py-2 text-sm"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                {i + 1}
              </span>
              <Input
                value={step.name}
                onChange={(e) =>
                  onChange((d) => {
                    (d as FunnelData).steps[i].name = e.target.value;
                  })
                }
                className="h-8 bg-background"
              />
              <Badge variant="outline" className="shrink-0 capitalize">
                {step.match_type}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono shrink-0 truncate max-w-[200px]">
                {step.match_event || step.match_path || ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GoalEditor({
  data,
  onChange,
}: {
  data: GoalData;
  onChange: (updater: (d: GoalData) => void) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="goal-name">Name</Label>
        <Input
          id="goal-name"
          value={data.name}
          onChange={(e) => onChange((d) => { d.name = e.target.value; })}
        />
      </div>
      <div className="space-y-2">
        <Label>Match type</Label>
        <Select
          value={data.match_type}
          onValueChange={(v) =>
            onChange((d) => {
              d.match_type = v;
              if (v === "pageview") {
                d.match_event = undefined;
              } else {
                d.match_path = undefined;
              }
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pageview">Pageview</SelectItem>
            <SelectItem value="event">Event</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {data.match_type === "pageview" ? (
        <div className="space-y-2">
          <Label htmlFor="goal-path">Match path</Label>
          <Input
            id="goal-path"
            value={data.match_path || ""}
            onChange={(e) => onChange((d) => { d.match_path = e.target.value; })}
            placeholder="/signup"
            className="font-mono"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="goal-event">Match event</Label>
          <Input
            id="goal-event"
            value={data.match_event || ""}
            onChange={(e) => onChange((d) => { d.match_event = e.target.value; })}
            placeholder="signup_complete"
            className="font-mono"
          />
        </div>
      )}
    </div>
  );
}

function RuleEditor({
  data,
  onChange,
}: {
  data: RuleData;
  onChange: (updater: (d: RuleData) => void) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="rule-name">Name</Label>
        <Input
          id="rule-name"
          value={data.name}
          onChange={(e) => onChange((d) => { d.name = e.target.value; })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rule-event">Event name</Label>
        <Input
          id="rule-event"
          value={data.event}
          onChange={(e) => onChange((d) => { d.event = e.target.value; })}
          placeholder="cta_click"
          className="font-mono"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rule-selector">CSS selector</Label>
        <Input
          id="rule-selector"
          value={data.selector}
          onChange={(e) => onChange((d) => { d.selector = e.target.value; })}
          placeholder="button.signup"
          className="font-mono"
        />
      </div>
      <div className="space-y-2">
        <Label>Trigger</Label>
        <Select
          value={data.trigger || "click"}
          onValueChange={(v) => onChange((d) => { d.trigger = v; })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="click">Click</SelectItem>
            <SelectItem value="submit">Submit</SelectItem>
            <SelectItem value="change">Change</SelectItem>
            <SelectItem value="focus">Focus</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.capture_text || false}
            onChange={(e) => onChange((d) => { d.capture_text = e.target.checked; })}
            className="rounded border-input"
          />
          Capture text
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.capture_value || false}
            onChange={(e) => onChange((d) => { d.capture_value = e.target.checked; })}
            className="rounded border-input"
          />
          Capture value
        </label>
      </div>
    </div>
  );
}
