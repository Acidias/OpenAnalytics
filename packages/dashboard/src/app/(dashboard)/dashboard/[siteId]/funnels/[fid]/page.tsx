"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatPercent, formatDurationShort } from "@/lib/utils";
import { ArrowDown, Filter, Users, CheckCircle2, TrendingUp } from "lucide-react";

interface FunnelStep {
  position: number;
  name: string;
  count: number;
  avg_time_ms: number | null;
}

interface FunnelData {
  funnel_id: string;
  funnel_name: string;
  steps: FunnelStep[];
  conversions: Record<string, string>;
}

/** Interpolate from blue (step 0) to emerald (final step). */
function stepColour(index: number, total: number): string {
  if (total <= 1) return "rgb(59, 130, 246)"; // blue-500
  const t = index / (total - 1);
  // blue-500 (59, 130, 246) -> emerald-500 (16, 185, 129)
  const r = Math.round(59 + (16 - 59) * t);
  const g = Math.round(130 + (185 - 130) * t);
  const b = Math.round(246 + (129 - 246) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function stepBorderClass(index: number, total: number): string {
  if (total <= 1) return "border-l-blue-500";
  const t = index / (total - 1);
  if (t < 0.25) return "border-l-blue-500";
  if (t < 0.5) return "border-l-cyan-500";
  if (t < 0.75) return "border-l-teal-500";
  return "border-l-emerald-500";
}

function FunnelDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded bg-muted animate-pulse" />
      </div>
      {/* Stat cards skeleton */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-5 space-y-2">
            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
            <div className="h-8 w-16 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
      {/* Funnel bars skeleton */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="h-5 w-40 rounded bg-muted animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div
              className="h-10 rounded bg-muted animate-pulse"
              style={{ width: `${100 - i * 20}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FunnelDetailPage() {
  const { siteId, fid } = useParams();
  const [data, setData] = useState<FunnelData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.funnels
      .get(siteId as string, fid as string)
      .then((d) => setData(d as FunnelData))
      .catch(() => setError("Failed to load funnel"));
  }, [siteId, fid]);

  if (error) return <p className="text-destructive">{error}</p>;

  if (!data) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Filter className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-semibold">Funnel</h1>
        </div>
        <FunnelDetailSkeleton />
      </div>
    );
  }

  const steps = data.steps;
  const entered = steps.length > 0 ? steps[0].count : 0;
  const converted = steps.length > 0 ? steps[steps.length - 1].count : 0;
  const overallRate = Number(data.conversions.overall_conversion_pct) || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Filter className="h-6 w-6 text-blue-500" />
        <h1 className="text-2xl font-semibold">{data.funnel_name}</h1>
      </div>

      {/* Overall stat cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Entered
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {entered.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Completed
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {converted.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Conversion rate
                </p>
                <p className="text-2xl font-bold tabular-nums text-emerald-600">
                  {formatPercent(overallRate)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel visualisation - horizontal narrowing bars */}
      {steps.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Funnel Flow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {steps.map((step, i) => {
              const widthPct =
                entered > 0 ? Math.max((step.count / entered) * 100, 2) : 0;
              const dropOff =
                i > 0 && steps[i - 1].count > 0
                  ? ((steps[i - 1].count - step.count) /
                      steps[i - 1].count) *
                    100
                  : 0;
              const colour = stepColour(i, steps.length);

              return (
                <div key={step.position}>
                  {/* Drop-off indicator between steps */}
                  {i > 0 && (
                    <div className="flex items-center gap-2 py-1.5 pl-3">
                      <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {dropOff > 0
                          ? `${formatPercent(dropOff)} drop-off`
                          : "No drop-off"}
                      </span>
                    </div>
                  )}

                  {/* Step bar */}
                  <div className="relative">
                    <div
                      className="rounded-md px-4 py-3 transition-all duration-500"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: colour,
                        minWidth: "180px",
                      }}
                    >
                      <div className="flex items-center justify-between gap-4 text-white">
                        <span className="text-sm font-medium truncate">
                          {i + 1}. {step.name}
                        </span>
                        <span className="text-sm font-bold tabular-nums shrink-0">
                          {step.count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Per-step detail cards */}
      <div>
        <h2 className="text-base font-semibold mb-4">Step Details</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {steps.map((step, i) => {
            const stepEntered = step.count;
            const stepCompleted =
              i < steps.length - 1 ? steps[i + 1].count : step.count;
            const dropped = stepEntered - stepCompleted;
            const conv =
              stepEntered > 0 ? (stepCompleted / stepEntered) * 100 : 0;
            const avgTimeSec =
              step.avg_time_ms != null
                ? Math.round(step.avg_time_ms / 1000)
                : null;
            const borderClass = stepBorderClass(i, steps.length);

            return (
              <Card
                key={step.position}
                className={`border-l-4 ${borderClass}`}
              >
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold">
                    {i + 1}. {step.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm px-4 pb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entered</span>
                    <span className="font-medium tabular-nums">
                      {stepEntered.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dropped</span>
                    <span className="font-medium tabular-nums text-red-500">
                      {dropped.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conv.</span>
                    <span className="font-medium tabular-nums">
                      {formatPercent(conv)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg time</span>
                    <span className="font-medium tabular-nums">
                      {avgTimeSec != null
                        ? formatDurationShort(avgTimeSec)
                        : "-"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
