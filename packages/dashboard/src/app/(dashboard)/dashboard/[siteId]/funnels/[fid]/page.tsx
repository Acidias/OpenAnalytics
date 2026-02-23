"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { api } from "@/lib/api";
import { formatPercent, formatDurationShort } from "@/lib/utils";

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
  if (!data) return <p className="text-muted-foreground">Loading...</p>;

  const steps = data.steps;
  const entered = steps.length > 0 ? steps[0].count : 0;
  const converted = steps.length > 0 ? steps[steps.length - 1].count : 0;
  const overallRate = Number(data.conversions.overall_conversion_pct) || 0;

  // Build chart data: each step has entered and completed counts
  const chartData = steps.map((s, i) => ({
    name: s.name,
    entered: s.count,
    completed: i < steps.length - 1 ? steps[i + 1].count : s.count,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{data.funnel_name}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Started: <span className="font-medium text-foreground">{entered.toLocaleString()}</span></span>
          <span>Completed: <span className="font-medium text-foreground">{converted.toLocaleString()}</span></span>
          <span className="font-medium text-green-500">{formatPercent(overallRate)} conversion</span>
        </div>
      </div>

      {/* Grouped bar chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend />
                <Bar dataKey="entered" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Entered" />
                <Bar dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Per-step detail cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {steps.map((step, i) => {
          const stepEntered = step.count;
          const stepCompleted = i < steps.length - 1 ? steps[i + 1].count : step.count;
          const dropped = stepEntered - stepCompleted;
          const conv = stepEntered > 0 ? (stepCompleted / stepEntered) * 100 : 0;
          const avgTimeSec = step.avg_time_ms != null ? Math.round(step.avg_time_ms / 1000) : null;

          return (
            <Card key={step.position}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{step.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entered</span>
                  <span className="font-medium">{stepEntered.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dropped</span>
                  <span className="font-medium text-red-500">{dropped.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conv.</span>
                  <span className="font-medium">{formatPercent(conv)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg time</span>
                  <span className="font-medium">
                    {avgTimeSec != null ? formatDurationShort(avgTimeSec) : "-"}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
