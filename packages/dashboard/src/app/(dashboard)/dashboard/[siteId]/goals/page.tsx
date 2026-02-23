"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Plus, Target } from "lucide-react";

interface Goal {
  id: string;
  name: string;
  match_type: string;
  match_path?: string;
  match_event?: string;
  completions: number;
  conversion_rate: number;
}

interface GoalsResponse {
  goals: Goal[];
  total_sessions: number;
}

function GoalsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-32 rounded bg-muted animate-pulse" />
            <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
          </div>
          <div className="h-9 w-24 rounded bg-muted animate-pulse" />
          <div className="h-2 w-full rounded-full bg-muted animate-pulse" />
          <div className="h-4 w-40 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function GoalsPage() {
  const { siteId } = useParams();
  const [data, setData] = useState<GoalsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.goals
      .list(siteId as string)
      .then((d) => setData(d as GoalsResponse))
      .catch(() => setError("Failed to load goals"));
  }, [siteId]);

  if (error) return <p className="text-destructive">{error}</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-emerald-500" />
          <h1 className="text-2xl font-semibold">Goals</h1>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Goal
        </Button>
      </div>

      {!data ? (
        <GoalsSkeleton />
      ) : data.goals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No goals configured yet. Create one to start tracking conversions.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.goals.map((goal) => {
            const isEvent = goal.match_type === "event";
            const borderColour = isEvent
              ? "border-l-emerald-500"
              : "border-l-blue-500";
            const badgeBg = isEvent
              ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
              : "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20";
            const rate = Math.min(goal.conversion_rate, 100);

            return (
              <Card
                key={goal.id}
                className={`border-l-4 ${borderColour} overflow-hidden`}
              >
                <CardContent className="pt-5 pb-5 space-y-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-tight">
                      {goal.name}
                    </h3>
                    <Badge
                      className={`${badgeBg} border-0 capitalize text-xs shrink-0`}
                    >
                      {goal.match_type}
                    </Badge>
                  </div>

                  {/* Main metric */}
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-3xl font-bold tabular-nums">
                        {goal.completions.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1.5">
                        completions
                      </span>
                    </div>
                    <span className="text-lg font-semibold tabular-nums text-emerald-600">
                      {goal.conversion_rate}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {data.total_sessions.toLocaleString()} total sessions
                    </p>
                  </div>

                  {/* Tracking target */}
                  <p className="text-xs text-muted-foreground">
                    Tracking:{" "}
                    <span className="font-mono text-foreground/70">
                      {goal.match_event || goal.match_path}
                    </span>
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
