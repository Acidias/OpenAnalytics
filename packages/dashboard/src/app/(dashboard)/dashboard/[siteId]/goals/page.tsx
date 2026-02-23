"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  if (!data) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Goals</h1>
        <Button><Plus className="mr-2 h-4 w-4" /> New Goal</Button>
      </div>

      {data.goals.length === 0 ? (
        <p className="text-muted-foreground">No goals configured yet. Create one to start tracking conversions.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.goals.map((goal) => (
            <Card key={goal.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">{goal.name}</CardTitle>
                </div>
                <Badge variant="secondary" className="capitalize">{goal.match_type}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-3xl font-bold">{goal.completions.toLocaleString()}</span>
                    <span className="text-muted-foreground ml-1">completions</span>
                  </div>
                  <span className="text-sm font-medium">{goal.conversion_rate}%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tracking: <span className="font-mono">{goal.match_event || goal.match_path}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Out of {data.total_sessions.toLocaleString()} total sessions
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
